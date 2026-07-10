import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4181;
const BASE_URL = `http://${HOST}:${PORT}`;
const USER_ID = '11111111-1111-4111-8111-111111111111';
const QUIZ_ID = '22222222-2222-4222-8222-222222222222';
const ATTEMPT_ID = '33333333-3333-4333-8333-333333333333';
const QUESTION_ID = '44444444-4444-4444-8444-444444444444';
const CREATED_QUIZ_ID = '55555555-5555-4555-8555-555555555555';
const GENERATION_JOB_ID = '66666666-6666-4666-8666-666666666666';
const GENERATED_QUIZ_ID = '77777777-7777-4777-8777-777777777777';
const DOCUMENT_GENERATION_JOB_ID = '88888888-8888-4888-8888-888888888888';
const DOCUMENT_GENERATED_QUIZ_ID = '99999999-9999-4999-8999-999999999999';
const TEXT_GENERATION_SOURCE = (
  'Photosynthesis converts light energy into chemical energy that plants store in glucose. '
  + 'Chlorophyll absorbs light in the chloroplasts, where carbon dioxide and water become glucose and oxygen. '
).repeat(4);
const DOCUMENT_GENERATION_SOURCE = (
  'Plants use photosynthesis to convert light energy, water, and carbon dioxide into glucose and oxygen. '
  + 'Chloroplasts contain chlorophyll, which absorbs light and drives the chemical reactions needed for growth. '
).repeat(4);

const createDevServer = () =>
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', HOST, '--port', String(PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

const stopDevServer = async (server) => {
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  server.kill('SIGKILL');
  await Promise.race([once(server, 'exit'), delay(2_000)]);
};

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`Server responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw lastError ?? new Error(`Server did not start at ${url}`);
};

const user = {
  id: USER_ID,
  username: 'e2e-user',
  email: 'e2e.user@example.com',
  isActive: true,
  roles: ['ROLE_USER'],
  createdAt: '2026-01-01T00:00:00Z',
  lastLoginDate: null,
};

const tokens = {
  accessToken: 'e2e-access-token',
  refreshToken: 'e2e-refresh-token',
  accessExpiresInMs: 3_600_000,
  refreshExpiresInMs: 86_400_000,
};

const quiz = {
  id: QUIZ_ID,
  creatorId: USER_ID,
  title: 'E2E Mobile Knowledge Check',
  description: 'A local-only test fixture.',
  visibility: 'PRIVATE',
  difficulty: 'EASY',
  status: 'DRAFT',
  estimatedTime: 1,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
  questionCount: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mobileQuestion = {
  id: QUESTION_ID,
  type: 'MCQ_SINGLE',
  difficulty: 'EASY',
  questionText: 'What is the capital of France?',
  safeContent: {
    options: [
      { id: 'a', text: 'Paris' },
      { id: 'b', text: 'Berlin' },
    ],
  },
  hint: null,
  attachmentUrl: null,
};

const fulfillJson = (route, body, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const installUnexpectedApiBlock = async (page) => {
  await page.route('**/api/v1/**', (route) => route.abort('blockedbyclient'));
};

const installAuthMeMock = async (page) => {
  await page.route('**/api/v1/auth/me', (route) => fulfillJson(route, user));
};

const fillLoginForm = async (page) => {
  await page.locator('input[name="username"]').fill('e2e-user');
  await page.locator('input[name="password"]').fill('Password1!');
};

const fillRegistrationForm = async (page) => {
  await page.locator('input[name="username"]').fill('e2e-user');
  await page.locator('input[name="email"]').fill('e2e.user@example.com');
  await page.locator('input[name="password"]').fill('Password1!');
  await page.locator('input[name="confirmPassword"]').fill('Password1!');
  await page.locator('#terms').check();
};

const getHorizontalOverflowingElements = async (page) =>
  page.evaluate(() => {
    const viewportWidth = window.innerWidth;

    return Array.from(document.body.querySelectorAll('*'))
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;

        if (!isVisible || (rect.left >= -1 && rect.right <= viewportWidth + 1)) {
          return [];
        }

        return [{
          tagName: element.tagName.toLowerCase(),
          className: element.getAttribute('class') || undefined,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        }];
      })
      .slice(0, 10);
  });

test('critical frontend journeys use local mocked API responses', { timeout: 120_000 }, async () => {
  const server = createDevServer();
  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();

    {
      const page = await (await browser.newContext()).newPage();
      const publicRoutes = ['/', '/terms', '/privacy', '/faq', '/roadmap', '/values'];

      try {
        await installUnexpectedApiBlock(page);

        for (const path of publicRoutes) {
          await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
          const headings = page.locator('h1');

          await headings.waitFor({ state: 'visible' });
          assert.equal(await headings.count(), 1, `Expected one primary heading at ${path}`);
          assert.equal(await headings.isVisible(), true, `Expected visible primary heading at ${path}`);
          assert.match(await page.title(), /Quizzence/i, `Expected Quizzence title at ${path}`);
        }

        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await Promise.all([
          page.waitForURL(`${BASE_URL}/login`),
          page.getByRole('button', { name: 'Login' }).click(),
        ]);
      } finally {
        await page.close();
      }
    }

    {
      const successPage = await (await browser.newContext()).newPage();
      const errorPage = await (await browser.newContext()).newPage();

      try {
        await installUnexpectedApiBlock(successPage);
        await installAuthMeMock(successPage);
        await successPage.route('**/api/v1/auth/login', async (route) => {
          assert.deepEqual(JSON.parse(route.request().postData() ?? '{}'), {
            username: 'e2e-user',
            password: 'Password1!',
          });
          await fulfillJson(route, tokens);
        });
        await successPage.route('**/api/v1/quizzes**', (route) => fulfillJson(route, {
          content: [],
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
          first: true,
          last: true,
          empty: true,
        }));

        await successPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        await fillLoginForm(successPage);
        await Promise.all([
          successPage.waitForURL(`${BASE_URL}/my-quizzes`),
          successPage.getByRole('button', { name: 'Sign in', exact: true }).click(),
        ]);

        await installUnexpectedApiBlock(errorPage);
        await errorPage.route('**/api/v1/auth/login', (route) => fulfillJson(route, {
          title: 'Invalid credentials',
          status: 401,
          detail: 'The supplied credentials are invalid.',
        }, 401));

        await errorPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        await fillLoginForm(errorPage);
        await errorPage.getByRole('button', { name: 'Sign in', exact: true }).click();
        await errorPage.getByText('Login failed. Please check your credentials and try again.').waitFor();
        assert.equal(errorPage.url(), `${BASE_URL}/login`);
      } finally {
        await successPage.close();
        await errorPage.close();
      }
    }

    {
      const registerSuccessPage = await (await browser.newContext()).newPage();
      const registerErrorPage = await (await browser.newContext()).newPage();
      const resetSuccessPage = await (await browser.newContext()).newPage();
      const resetErrorPage = await (await browser.newContext()).newPage();

      try {
        await installUnexpectedApiBlock(registerSuccessPage);
        await registerSuccessPage.route('**/api/v1/auth/register', (route) => fulfillJson(route, user, 201));
        await registerSuccessPage.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
        await fillRegistrationForm(registerSuccessPage);
        await Promise.all([
          registerSuccessPage.waitForURL(`${BASE_URL}/login`),
          registerSuccessPage.getByRole('button', { name: 'Create account' }).click(),
        ]);

        await installUnexpectedApiBlock(registerErrorPage);
        await registerErrorPage.route('**/api/v1/auth/register', (route) => fulfillJson(route, {
          title: 'Conflict',
          status: 409,
          detail: 'Username is already in use.',
        }, 409));
        await registerErrorPage.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
        await fillRegistrationForm(registerErrorPage);
        await registerErrorPage.getByRole('button', { name: 'Create account' }).click();
        await registerErrorPage.getByText('Registration failed. Please try again.').waitFor();

        await installUnexpectedApiBlock(resetSuccessPage);
        await resetSuccessPage.route('**/api/v1/auth/forgot-password', (route) => fulfillJson(route, {
          message: 'Password reset request accepted.',
        }, 202));
        await resetSuccessPage.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle' });
        await resetSuccessPage.getByLabel('Email Address').fill('e2e.user@example.com');
        await resetSuccessPage.getByRole('button', { name: 'Send reset link' }).click();
        await resetSuccessPage.getByText('Password reset email sent').waitFor();

        await installUnexpectedApiBlock(resetErrorPage);
        await resetErrorPage.route('**/api/v1/auth/forgot-password', (route) => fulfillJson(route, {
          title: 'Service unavailable',
          status: 503,
          detail: 'Password reset is temporarily unavailable.',
        }, 503));
        await resetErrorPage.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle' });
        await resetErrorPage.getByLabel('Email Address').fill('e2e.user@example.com');
        await resetErrorPage.getByRole('button', { name: 'Send reset link' }).click();
        await resetErrorPage.getByText('Failed to send password reset email. Please try again.').waitFor();
      } finally {
        await registerSuccessPage.close();
        await registerErrorPage.close();
        await resetSuccessPage.close();
        await resetErrorPage.close();
      }
    }

    {
      const page = await (await browser.newContext()).newPage();
      let createdQuizRequest = null;
      let questionListQuery = null;

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/quizzes', async (route) => {
          assert.equal(route.request().method(), 'POST');
          createdQuizRequest = JSON.parse(route.request().postData() ?? '{}');
          await fulfillJson(route, { quizId: CREATED_QUIZ_ID });
        });
        await page.route('**/api/v1/questions**', async (route) => {
          const requestUrl = new URL(route.request().url());
          questionListQuery = {
            quizId: requestUrl.searchParams.get('quizId'),
            pageNumber: requestUrl.searchParams.get('pageNumber'),
            page: requestUrl.searchParams.get('page'),
            size: requestUrl.searchParams.get('size'),
          };
          await fulfillJson(route, {
            content: [],
            totalPages: 0,
            totalElements: 0,
            size: 50,
            number: 0,
            first: true,
            last: true,
            empty: true,
          });
        });

        await page.goto(`${BASE_URL}/quizzes/create`, { waitUntil: 'networkidle' });
        await page.getByText('Manual Creation', { exact: true }).click();
        await page.getByRole('heading', { name: 'Configure Your Manual Quiz' }).waitFor();

        await page.locator('input[placeholder="Enter quiz title..."]').fill('E2E Manual Quiz');
        await page.getByLabel('Description').fill('Created through the critical E2E journey.');
        await page.locator('input[type="number"]').fill('15');
        await page.getByRole('button', { name: 'Create Quiz & Add Questions' }).click();
        await page.getByRole('heading', { name: 'Add Questions to "E2E Manual Quiz"' }).waitFor();

        assert.deepEqual(createdQuizRequest, {
          title: 'E2E Manual Quiz',
          description: 'Created through the critical E2E journey.',
          visibility: 'PRIVATE',
          difficulty: 'MEDIUM',
          isRepetitionEnabled: false,
          timerEnabled: false,
          estimatedTime: 15,
          timerDuration: 30,
          tagIds: [],
        });
        assert.deepEqual(questionListQuery, {
          quizId: CREATED_QUIZ_ID,
          pageNumber: '0',
          page: null,
          size: '50',
        });

        await page.getByRole('button', { name: 'Save Draft' }).click();
        await page.getByText('Quiz Created Successfully!', { exact: true }).waitFor();
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await browser.newContext()).newPage();
      let generationRequest = null;
      let generationStatusRequests = 0;

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/quizzes/generate-from-text', async (route) => {
          assert.equal(route.request().method(), 'POST');
          generationRequest = JSON.parse(route.request().postData() ?? '{}');
          await fulfillJson(route, {
            jobId: GENERATION_JOB_ID,
            status: 'PENDING',
            message: 'Quiz generation started successfully',
            estimatedTimeSeconds: 10,
          }, 202);
        });
        await page.route(`**/api/v1/quizzes/generation-status/${GENERATION_JOB_ID}`, async (route) => {
          assert.equal(route.request().method(), 'GET');
          generationStatusRequests += 1;

          await fulfillJson(route, generationStatusRequests === 1 ? {
            jobId: GENERATION_JOB_ID,
            status: 'PROCESSING',
            totalChunks: 1,
            processedChunks: 0,
            progressPercentage: 50,
            currentChunk: 'Generating questions',
            totalQuestionsGenerated: 12,
            elapsedTimeSeconds: 5,
            estimatedTimeRemainingSeconds: 5,
            generatedQuizId: null,
            startedAt: '2026-01-01T00:00:00Z',
            completedAt: null,
          } : {
            jobId: GENERATION_JOB_ID,
            status: 'COMPLETED',
            totalChunks: 1,
            processedChunks: 1,
            progressPercentage: 100,
            currentChunk: 'Generation complete',
            totalQuestionsGenerated: 25,
            elapsedTimeSeconds: 10,
            estimatedTimeRemainingSeconds: 0,
            generatedQuizId: GENERATED_QUIZ_ID,
            startedAt: '2026-01-01T00:00:00Z',
            completedAt: '2026-01-01T00:00:10Z',
          });
        });

        await page.goto(`${BASE_URL}/quizzes/create`, { waitUntil: 'networkidle' });
        await page.getByText('Generate from Text', { exact: true }).click();
        await page.getByRole('heading', { name: 'Configure Your Text-Based Quiz' }).waitFor();

        await page.locator('input[placeholder="Enter quiz title..."]').fill('E2E Text Generation Quiz');
        await page.locator('input[placeholder="Brief description..."]').fill('Generated from a local E2E fixture.');
        await page.getByLabel('Text Content *').fill(TEXT_GENERATION_SOURCE);
        await page.getByRole('button', { name: 'Generate Quiz from Text' }).click();
        await page.getByRole('heading', { name: 'Generating Your Quiz' }).waitFor();
        await page.getByText('PROCESSING', { exact: true }).waitFor();
        await page.getByText('Quiz Created Successfully!', { exact: true }).waitFor();

        assert.deepEqual(generationRequest, {
          text: TEXT_GENERATION_SOURCE,
          quizTitle: 'E2E Text Generation Quiz',
          quizDescription: 'Generated from a local E2E fixture.',
          questionsPerType: {
            MCQ_SINGLE: 10,
            MCQ_MULTI: 5,
            FILL_GAP: 5,
            MATCHING: 5,
          },
          difficulty: 'MEDIUM',
          chunkingStrategy: 'SIZE_BASED',
          maxChunkSize: 100000,
        });
        assert.equal(generationStatusRequests, 2);
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await browser.newContext()).newPage();
      let uploadRequest = null;
      let generationStatusRequests = 0;

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/quizzes/generate-from-upload**', async (route) => {
          assert.equal(route.request().method(), 'POST');
          const requestUrl = new URL(route.request().url());
          uploadRequest = {
            query: Object.fromEntries(requestUrl.searchParams.entries()),
            contentType: route.request().headers()['content-type'],
            body: route.request().postDataBuffer()?.toString(),
          };
          await fulfillJson(route, {
            jobId: DOCUMENT_GENERATION_JOB_ID,
            status: 'PENDING',
            message: 'Document processing and quiz generation started',
            estimatedTimeSeconds: 10,
          }, 202);
        });
        await page.route(`**/api/v1/quizzes/generation-status/${DOCUMENT_GENERATION_JOB_ID}`, async (route) => {
          assert.equal(route.request().method(), 'GET');
          generationStatusRequests += 1;

          await fulfillJson(route, generationStatusRequests === 1 ? {
            jobId: DOCUMENT_GENERATION_JOB_ID,
            status: 'PROCESSING',
            totalChunks: 1,
            processedChunks: 0,
            progressPercentage: 50,
            currentChunk: 'Processing selected document content',
            totalQuestionsGenerated: 12,
            elapsedTimeSeconds: 5,
            estimatedTimeRemainingSeconds: 5,
            generatedQuizId: null,
            startedAt: '2026-01-01T00:00:00Z',
            completedAt: null,
          } : {
            jobId: DOCUMENT_GENERATION_JOB_ID,
            status: 'COMPLETED',
            totalChunks: 1,
            processedChunks: 1,
            progressPercentage: 100,
            currentChunk: 'Generation complete',
            totalQuestionsGenerated: 25,
            elapsedTimeSeconds: 10,
            estimatedTimeRemainingSeconds: 0,
            generatedQuizId: DOCUMENT_GENERATED_QUIZ_ID,
            startedAt: '2026-01-01T00:00:00Z',
            completedAt: '2026-01-01T00:00:10Z',
          });
        });

        await page.goto(`${BASE_URL}/quizzes/create`, { waitUntil: 'networkidle' });
        await page.getByText('Generate from Document', { exact: true }).click();
        await page.getByRole('heading', { name: 'Configure Your Document-Based Quiz' }).waitFor();

        await page.locator('input[placeholder="Title is auto-generated from filename if empty"]').fill('E2E Document Generation Quiz');
        await page.locator('input[placeholder="Brief description..."]').fill('Generated from a selected document page.');
        await page.locator('#document-upload').setInputFiles({
          name: 'photosynthesis.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from(DOCUMENT_GENERATION_SOURCE),
        });
        await page.getByRole('heading', { name: 'photosynthesis.txt' }).waitFor();
        await page.getByRole('button', { name: 'All', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm Selection (1)' }).click();
        await page.getByRole('button', { name: 'Generate Quiz from Document' }).click();
        await page.getByRole('heading', { name: 'Generating Your Quiz' }).waitFor();
        await page.getByText('PROCESSING', { exact: true }).waitFor();
        await page.getByText('Quiz Created Successfully!', { exact: true }).waitFor();

        assert.deepEqual(uploadRequest?.query, {
          quizScope: 'ENTIRE_DOCUMENT',
          chunkingStrategy: 'SIZE_BASED',
          maxChunkSize: '100000',
          quizTitle: 'E2E Document Generation Quiz',
          quizDescription: 'Generated from a selected document page.',
          questionsPerType: '{"MCQ_SINGLE":10,"MCQ_MULTI":5,"FILL_GAP":5,"MATCHING":5}',
          difficulty: 'MEDIUM',
        });
        assert.match(uploadRequest?.contentType ?? '', /^multipart\/form-data; boundary=/);
        assert.match(uploadRequest?.body ?? '', /name="file"/);
        assert.match(uploadRequest?.body ?? '', /Plants use photosynthesis/);
        assert.equal(generationStatusRequests, 2);
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      let submittedAnswer = null;
      let reviewQuery = null;

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route(`**/api/v1/quizzes/${QUIZ_ID}`, (route) => fulfillJson(route, quiz));
        await page.route(`**/api/v1/attempts/${ATTEMPT_ID}/current-question`, (route) => fulfillJson(route, {
          question: mobileQuestion,
          questionNumber: 1,
          totalQuestions: 1,
          attemptStatus: 'IN_PROGRESS',
        }));
        await page.route(`**/api/v1/attempts/${ATTEMPT_ID}/stats`, (route) => fulfillJson(route, {
          attemptId: ATTEMPT_ID,
          totalTime: 'PT0S',
          averageTimePerQuestion: 'PT0S',
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracyPercentage: 0,
          completionPercentage: 0,
          questionTimings: [],
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: null,
        }));
        await page.route(`**/api/v1/attempts/${ATTEMPT_ID}/answers`, async (route) => {
          submittedAnswer = JSON.parse(route.request().postData() ?? '{}');
          await fulfillJson(route, {
            answerId: '55555555-5555-4555-8555-555555555555',
            questionId: QUESTION_ID,
            isCorrect: true,
            score: 1,
            answeredAt: '2026-01-01T00:00:01Z',
            correctAnswer: { correctOptionId: 'a' },
            explanation: 'Paris is the capital of France.',
            nextQuestion: null,
          });
        });
        await page.route(`**/api/v1/attempts/${ATTEMPT_ID}/complete`, (route) => fulfillJson(route, {
          attemptId: ATTEMPT_ID,
          quizId: QUIZ_ID,
          userId: USER_ID,
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: '2026-01-01T00:01:00Z',
          totalScore: 1,
          correctCount: 1,
          totalQuestions: 1,
          answers: [],
        }));
        await page.route(`**/api/v1/attempts/${ATTEMPT_ID}/review**`, (route) => {
          const requestUrl = new URL(route.request().url());
          reviewQuery = Object.fromEntries(requestUrl.searchParams.entries());
          return fulfillJson(route, {
            attemptId: ATTEMPT_ID,
            quizId: QUIZ_ID,
            userId: USER_ID,
            startedAt: '2026-01-01T00:00:00Z',
            completedAt: '2026-01-01T00:01:00Z',
            totalScore: 1,
            correctCount: 1,
            totalQuestions: 1,
            answers: [{
              questionId: QUESTION_ID,
              type: 'MCQ_SINGLE',
              questionText: 'What is the capital of France?',
              hint: null,
              attachmentUrl: null,
              questionSafeContent: mobileQuestion.safeContent,
              userResponse: { selectedOptionId: 'a' },
              correctAnswer: { correctOptionId: 'a' },
              isCorrect: true,
              score: 1,
              explanation: 'Paris is the capital of France.',
              answeredAt: '2026-01-01T00:00:01Z',
            }],
          });
        });
        await page.route(`**/api/v1/attempts/${ATTEMPT_ID}`, (route) => fulfillJson(route, {
          attemptId: ATTEMPT_ID,
          quizId: QUIZ_ID,
          userId: USER_ID,
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: null,
          status: 'IN_PROGRESS',
          mode: 'ONE_BY_ONE',
          answers: [],
        }));

        await page.goto(`${BASE_URL}/quizzes/${QUIZ_ID}/attempt?attemptId=${ATTEMPT_ID}`, {
          waitUntil: 'networkidle',
        });
        await page.getByText('What is the capital of France?').waitFor();

        assert.equal(
          await page.getByRole('button', { name: 'Found a bug?' }).isVisible(),
          false,
          'Expected the desktop bug-report control to be hidden at the mobile viewport',
        );
        assert.equal(
          await page.getByRole('button', { name: 'Logout' }).isVisible(),
          false,
          'Expected the desktop logout control to be hidden at the mobile viewport',
        );

        const overflowingElements = await getHorizontalOverflowingElements(page);
        assert.deepEqual(
          overflowingElements,
          [],
          `Expected no horizontal overflow at the mobile attempt viewport. Found: ${JSON.stringify(overflowingElements)}`,
        );

        await page.getByText('Paris', { exact: true }).click();
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByRole('button', { name: 'View Results' }).waitFor();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedAnswer, {
          questionId: QUESTION_ID,
          response: { selectedOptionId: 'a' },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });

        await Promise.all([
          page.waitForURL(`${BASE_URL}/quizzes/${QUIZ_ID}/results?attemptId=${ATTEMPT_ID}`),
          page.getByRole('button', { name: 'View Results' }).click(),
        ]);
        await page.getByRole('heading', { name: 'Quiz Results' }).waitFor();
        await page.getByText('Answer Review', { exact: true }).waitFor();
        await page.getByRole('heading', { name: 'What is the capital of France?' }).click();
        await page.getByText('Your Answer:', { exact: true }).waitFor();
        await page.getByText('Correct Answer:', { exact: true }).waitFor();
        await page.getByText('Paris is the capital of France.', { exact: true }).waitFor();

        assert.deepEqual(reviewQuery, {
          includeUserAnswers: 'true',
          includeCorrectAnswers: 'true',
          includeQuestionContext: 'true',
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await stopDevServer(server);
  }
});
