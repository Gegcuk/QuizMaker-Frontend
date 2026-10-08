import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { launchBrowser } from '../../scripts/browser/launch-browser.mjs';
import { createTestContext } from '../fixtures/browser-context.mjs';

const HOST = '127.0.0.1';
const PORT = 4181;
const BASE_URL = process.env.RELEASE_BASE_URL || `http://${HOST}:${PORT}`;
const USER_ID = '11111111-1111-4111-8111-111111111111';
const QUIZ_ID = '22222222-2222-4222-8222-222222222222';
const ATTEMPT_ID = '33333333-3333-4333-8333-333333333333';
const QUESTION_ID = '44444444-4444-4444-8444-444444444444';
const CREATED_QUIZ_ID = '55555555-5555-4555-8555-555555555555';
const FILL_GAP_ATTEMPT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FILL_GAP_QUESTION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MATCHING_ATTEMPT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const MATCHING_QUESTION_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const MCQ_MULTI_ATTEMPT_ID = '10101010-1010-4010-8010-101010101010';
const MCQ_MULTI_QUESTION_ID = '10101011-1010-4010-8010-101010101010';
const TRUE_FALSE_ATTEMPT_ID = '20202020-2020-4020-8020-202020202020';
const TRUE_FALSE_QUESTION_ID = '20202021-2020-4020-8020-202020202020';
const COMPLIANCE_ATTEMPT_ID = '30303030-3030-4030-8030-303030303030';
const COMPLIANCE_QUESTION_ID = '30303031-3030-4030-8030-303030303030';
const ORDERING_ATTEMPT_ID = '40404040-4040-4040-8040-404040404040';
const ORDERING_QUESTION_ID = '40404041-4040-4040-8040-404040404040';
const HOTSPOT_ATTEMPT_ID = '50505050-5050-4050-8050-505050505050';
const HOTSPOT_QUESTION_ID = '50505051-5050-4050-8050-505050505050';
const HOTSPOT_TEST_IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3C/svg%3E';
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
  if (!server) return;
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

const navigateToAppRoute = async (page, path) => {
  const response = await page.goto(new URL(path, `${BASE_URL}/`).toString(), {
    waitUntil: 'domcontentloaded',
  });

  assert.ok(response, `Expected a document response for ${path}`);
  assert.equal(
    response.ok(),
    true,
    `Expected ${path} to return a successful document response, got ${response.status()}`,
  );
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

const fillGapQuestion = {
  id: FILL_GAP_QUESTION_ID,
  type: 'FILL_GAP',
  difficulty: 'MEDIUM',
  questionText: 'Complete the sentence about cellular respiration.',
  safeContent: {
    text: 'Cellular respiration occurs in the {1} and produces {2} for cellular energy.',
    gaps: [
      { id: 1, answer: 'mitochondria' },
      { id: 2, answer: 'ATP' },
    ],
    options: [
      'mitochondria',
      'ATP',
      'chloroplast',
      'ribosome',
      'nucleus',
      'glucose',
      'NADH',
      'oxygen',
    ],
  },
  hint: 'Think about the cell organelle and its energy currency.',
  attachmentUrl: null,
};

const matchingQuestion = {
  id: MATCHING_QUESTION_ID,
  type: 'MATCHING',
  difficulty: 'MEDIUM',
  questionText: 'Match each cell organelle to its function.',
  safeContent: {
    left: [
      { id: 1, text: 'Mitochondria', matchId: 1 },
      { id: 2, text: 'Ribosome', matchId: 2 },
      { id: 3, text: 'Nucleus', matchId: 3 },
      { id: 4, text: 'Golgi apparatus', matchId: 4 },
    ],
    right: [
      { id: 1, text: 'Energy production' },
      { id: 2, text: 'Protein synthesis' },
      { id: 3, text: 'Genetic information storage' },
      { id: 4, text: 'Protein packaging and modification' },
    ],
  },
  hint: null,
  attachmentUrl: null,
};

const multiChoiceQuestion = {
  id: MCQ_MULTI_QUESTION_ID,
  type: 'MCQ_MULTI',
  difficulty: 'MEDIUM',
  questionText: 'Which practices protect an online account?',
  safeContent: {
    options: [
      { id: 'a', text: 'Use a unique password' },
      { id: 'b', text: 'Share passwords with colleagues' },
      { id: 'c', text: 'Enable multi-factor authentication' },
      { id: 'd', text: 'Reuse the same password everywhere' },
    ],
  },
  hint: null,
  attachmentUrl: null,
};

const trueFalseQuestion = {
  id: TRUE_FALSE_QUESTION_ID,
  type: 'TRUE_FALSE',
  difficulty: 'EASY',
  questionText: 'A strong password should be shared only with trusted teammates.',
  safeContent: {},
  hint: null,
  attachmentUrl: null,
};

const complianceQuestion = {
  id: COMPLIANCE_QUESTION_ID,
  type: 'COMPLIANCE',
  difficulty: 'MEDIUM',
  questionText: 'Select the data handling practices that comply with the policy.',
  safeContent: {
    statements: [
      { id: 1, text: 'Obtain explicit consent before sending marketing emails.' },
      { id: 2, text: 'Keep customer data forever without a stated purpose.' },
      { id: 3, text: 'Allow recipients to unsubscribe from marketing emails.' },
    ],
  },
  hint: null,
  attachmentUrl: null,
};

const orderingQuestion = {
  id: ORDERING_QUESTION_ID,
  type: 'ORDERING',
  difficulty: 'MEDIUM',
  questionText: 'Arrange the release steps from first to last.',
  safeContent: {
    items: [
      { id: 3, text: 'Deploy the approved release' },
      { id: 1, text: 'Review the proposed changes' },
      { id: 2, text: 'Approve the release candidate' },
    ],
  },
  hint: null,
  attachmentUrl: null,
};

const hotspotQuestion = {
  id: HOTSPOT_QUESTION_ID,
  type: 'HOTSPOT',
  difficulty: 'EASY',
  questionText: 'Select the highlighted secure area on the diagram.',
  safeContent: {
    imageUrl: HOTSPOT_TEST_IMAGE_URL,
    regions: [
      { id: 1, x: 10, y: 10, width: 20, height: 20 },
      { id: 2, x: 40, y: 40, width: 20, height: 20 },
    ],
  },
  hint: null,
  attachmentUrl: null,
};

const createEditableQuestion = ({ id, type, difficulty, questionText, content }) => ({
  id,
  type,
  difficulty,
  questionText,
  content,
  hint: 'Original hint for editing.',
  explanation: 'Original explanation for editing.',
  attachmentUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  quizIds: [QUIZ_ID],
  tagIds: [],
});

const editableQuestions = [
  createEditableQuestion({
    id: '70707070-7070-4070-8070-707070707070',
    type: 'MCQ_SINGLE',
    difficulty: 'EASY',
    questionText: 'Which option is the secure single-choice answer?',
    content: {
      options: [
        { id: 'a', text: 'Use a unique password', correct: true },
        { id: 'b', text: 'Reuse a public password', correct: false },
        { id: 'c', text: 'Share login details', correct: false },
        { id: 'd', text: 'Disable account recovery', correct: false },
      ],
    },
  }),
  createEditableQuestion({
    id: '71717171-7171-4071-8071-717171717171',
    type: 'MCQ_MULTI',
    difficulty: 'MEDIUM',
    questionText: 'Which practices improve account security?',
    content: {
      options: [
        { id: 'a', text: 'Use a password manager', correct: true },
        { id: 'b', text: 'Enable multi-factor authentication', correct: true },
        { id: 'c', text: 'Publish passwords in chat', correct: false },
        { id: 'd', text: 'Reuse a password everywhere', correct: false },
      ],
    },
  }),
  createEditableQuestion({
    id: '72727272-7272-4072-8072-727272727272',
    type: 'TRUE_FALSE',
    difficulty: 'EASY',
    questionText: 'Passwords should be shared only with trusted teammates.',
    content: { answer: false },
  }),
  createEditableQuestion({
    id: '73737373-7373-4073-8073-737373737373',
    type: 'FILL_GAP',
    difficulty: 'MEDIUM',
    questionText: 'Use a {1} and enable {2} to protect an account.',
    content: {
      text: 'Use a {1} and enable {2} to protect an account.',
      gaps: [
        { id: 1, answer: 'password manager' },
        { id: 2, answer: 'multi-factor authentication' },
      ],
      options: [
        'password manager',
        'multi-factor authentication',
        'shared spreadsheet',
        'public chat room',
        'disabled recovery',
        'reused password',
        'unprotected device',
        'anonymous login',
      ],
    },
  }),
  createEditableQuestion({
    id: '74747474-7474-4074-8074-747474747474',
    type: 'COMPLIANCE',
    difficulty: 'MEDIUM',
    questionText: 'Which practices comply with the data policy?',
    content: {
      statements: [
        { id: 1, text: 'Obtain explicit consent before marketing.', compliant: true },
        { id: 2, text: 'Retain all data without a purpose.', compliant: false },
      ],
    },
  }),
  createEditableQuestion({
    id: '75757575-7575-4075-8075-757575757575',
    type: 'ORDERING',
    difficulty: 'MEDIUM',
    questionText: 'Arrange the release steps in their intended order.',
    content: {
      items: [
        { id: 1, text: 'Review the proposed changes' },
        { id: 2, text: 'Approve the release candidate' },
        { id: 3, text: 'Deploy the approved release' },
      ],
    },
  }),
  createEditableQuestion({
    id: '76767676-7676-4076-8076-767676767676',
    type: 'HOTSPOT',
    difficulty: 'EASY',
    questionText: 'Select the secure region in the image.',
    content: {
      imageUrl: HOTSPOT_TEST_IMAGE_URL,
      regions: [
        { id: 1, x: 10, y: 10, width: 20, height: 20, correct: true },
        { id: 2, x: 40, y: 40, width: 20, height: 20, correct: false },
      ],
    },
  }),
  createEditableQuestion({
    id: '77777777-7777-4077-8077-777777777777',
    type: 'MATCHING',
    difficulty: 'MEDIUM',
    questionText: 'Match every security control to its purpose.',
    content: {
      left: [
        { id: 1, text: 'Password manager', matchId: 1 },
        { id: 2, text: 'Multi-factor authentication', matchId: 2 },
        { id: 3, text: 'Account recovery', matchId: 3 },
        { id: 4, text: 'Audit log', matchId: 4 },
      ],
      right: [
        { id: 1, text: 'Stores unique passwords' },
        { id: 2, text: 'Adds a second verification step' },
        { id: 3, text: 'Restores access safely' },
        { id: 4, text: 'Records account activity' },
      ],
    },
  }),
];

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

const installSingleQuestionAttemptMocks = async (page, { attemptId, question, onAnswer }) => {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'e2e-access-token');
    localStorage.setItem('refreshToken', 'e2e-refresh-token');
  });
  await installUnexpectedApiBlock(page);
  await installAuthMeMock(page);
  await page.route(`**/api/v1/quizzes/${QUIZ_ID}`, (route) => fulfillJson(route, quiz));
  await page.route(`**/api/v1/attempts/${attemptId}/current-question`, (route) => fulfillJson(route, {
    question,
    questionNumber: 1,
    totalQuestions: 1,
    attemptStatus: 'IN_PROGRESS',
  }));
  await page.route(`**/api/v1/attempts/${attemptId}/stats`, (route) => fulfillJson(route, {
    attemptId,
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
  await page.route(`**/api/v1/attempts/${attemptId}/answers`, onAnswer);
  await page.route(`**/api/v1/attempts/${attemptId}`, (route) => fulfillJson(route, {
    attemptId,
    quizId: QUIZ_ID,
    userId: USER_ID,
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
    status: 'IN_PROGRESS',
    mode: 'ONE_BY_ONE',
    answers: [],
  }));
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
  const server = process.env.RELEASE_BASE_URL ? null : createDevServer();
  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();

    {
      const page = await (await createTestContext(browser)).newPage();
      const publicRoutes = ['/', '/terms/', '/privacy/', '/faq/', '/roadmap/', '/values/'];

      try {
        await installUnexpectedApiBlock(page);

        for (const path of publicRoutes) {
          await navigateToAppRoute(page, path);
          const headings = page.locator('h1');

          await headings.waitFor({ state: 'visible' });
          assert.equal(await headings.count(), 1, `Expected one primary heading at ${path}`);
          assert.equal(await headings.isVisible(), true, `Expected visible primary heading at ${path}`);
          assert.match(await page.title(), /Quizzence/i, `Expected Quizzence title at ${path}`);
        }

        await navigateToAppRoute(page, '/');
        await Promise.all([
          page.waitForURL(`${BASE_URL}/login`),
          page.getByRole('button', { name: 'Login' }).click(),
        ]);
      } finally {
        await page.close();
      }
    }

    {
      const successPage = await (await createTestContext(browser)).newPage();
      const errorPage = await (await createTestContext(browser)).newPage();

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

        await navigateToAppRoute(successPage, '/login');
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

        await navigateToAppRoute(errorPage, '/login');
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
      const registerSuccessPage = await (await createTestContext(browser)).newPage();
      const registerErrorPage = await (await createTestContext(browser)).newPage();
      const resetSuccessPage = await (await createTestContext(browser)).newPage();
      const resetErrorPage = await (await createTestContext(browser)).newPage();

      try {
        await installUnexpectedApiBlock(registerSuccessPage);
        await registerSuccessPage.route('**/api/v1/auth/register', (route) => fulfillJson(route, user, 201));
        await navigateToAppRoute(registerSuccessPage, '/register');
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
        await navigateToAppRoute(registerErrorPage, '/register');
        await fillRegistrationForm(registerErrorPage);
        await registerErrorPage.getByRole('button', { name: 'Create account' }).click();
        await registerErrorPage.getByText('Registration failed. Please try again.').waitFor();

        await installUnexpectedApiBlock(resetSuccessPage);
        await resetSuccessPage.route('**/api/v1/auth/forgot-password', (route) => fulfillJson(route, {
          message: 'Password reset request accepted.',
        }, 202));
        await navigateToAppRoute(resetSuccessPage, '/forgot-password');
        await resetSuccessPage.getByLabel('Email Address').fill('e2e.user@example.com');
        await resetSuccessPage.getByRole('button', { name: 'Send reset link' }).click();
        await resetSuccessPage.getByText('Password reset email sent').waitFor();

        await installUnexpectedApiBlock(resetErrorPage);
        await resetErrorPage.route('**/api/v1/auth/forgot-password', (route) => fulfillJson(route, {
          title: 'Service unavailable',
          status: 503,
          detail: 'Password reset is temporarily unavailable.',
        }, 503));
        await navigateToAppRoute(resetErrorPage, '/forgot-password');
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
      const page = await (await createTestContext(browser)).newPage();
      let createdQuizRequest = null;

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

        await navigateToAppRoute(page, '/quizzes/create');
        await page.getByText('Manual Creation', { exact: true }).click();
        await page.getByRole('heading', { name: 'Configure Your Manual Quiz' }).waitFor();

        await page.locator('input[placeholder="Enter quiz title..."]').fill('E2E Manual Quiz');
        await page.getByLabel('Description').fill('Created through the critical E2E journey.');
        await page.locator('input[type="number"]').fill('15');

        const paginatedQuestionListRequest = page.waitForRequest((request) => {
          if (request.method() !== 'GET') {
            return false;
          }

          const requestUrl = new URL(request.url());
          return requestUrl.pathname === '/api/v1/questions'
            && requestUrl.searchParams.get('quizId') === CREATED_QUIZ_ID
            && requestUrl.searchParams.get('pageNumber') === '0'
            && requestUrl.searchParams.get('size') === '50';
        });

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
        const requestUrl = new URL((await paginatedQuestionListRequest).url());
        assert.deepEqual({
          quizId: requestUrl.searchParams.get('quizId'),
          pageNumber: requestUrl.searchParams.get('pageNumber'),
          page: requestUrl.searchParams.get('page'),
          size: requestUrl.searchParams.get('size'),
        }, {
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
      const page = await (await createTestContext(browser)).newPage();
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

        await navigateToAppRoute(page, '/quizzes/create');
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
      const page = await (await createTestContext(browser)).newPage();
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

        await navigateToAppRoute(page, '/quizzes/create');
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
      const page = await (await createTestContext(browser)).newPage();
      let submittedFillGapAnswer = null;

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route(`**/api/v1/quizzes/${QUIZ_ID}`, (route) => fulfillJson(route, quiz));
        await page.route(`**/api/v1/attempts/${FILL_GAP_ATTEMPT_ID}/current-question`, (route) => fulfillJson(route, {
          question: fillGapQuestion,
          questionNumber: 1,
          totalQuestions: 1,
          attemptStatus: 'IN_PROGRESS',
        }));
        await page.route(`**/api/v1/attempts/${FILL_GAP_ATTEMPT_ID}/stats`, (route) => fulfillJson(route, {
          attemptId: FILL_GAP_ATTEMPT_ID,
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
        await page.route(`**/api/v1/attempts/${FILL_GAP_ATTEMPT_ID}/answers`, async (route) => {
          submittedFillGapAnswer = JSON.parse(route.request().postData() ?? '{}');
          await fulfillJson(route, {
            answerId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            questionId: FILL_GAP_QUESTION_ID,
            isCorrect: true,
            score: 1,
            answeredAt: '2026-01-01T00:00:01Z',
            correctAnswer: {
              answers: [
                { id: 1, text: 'mitochondria' },
                { id: 2, text: 'ATP' },
              ],
            },
            explanation: 'Cellular respiration uses mitochondria to produce ATP.',
            nextQuestion: null,
          });
        });
        await page.route(`**/api/v1/attempts/${FILL_GAP_ATTEMPT_ID}`, (route) => fulfillJson(route, {
          attemptId: FILL_GAP_ATTEMPT_ID,
          quizId: QUIZ_ID,
          userId: USER_ID,
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: null,
          status: 'IN_PROGRESS',
          mode: 'ONE_BY_ONE',
          answers: [],
        }));

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${FILL_GAP_ATTEMPT_ID}`,
        );
        await page.getByText('Answer pool', { exact: true }).waitFor();
        await page.getByText('Active gap: 1', { exact: true }).waitFor();

        await page.getByRole('button', { name: 'mitochondria', exact: true }).click();
        await page.getByText('Active gap: 2', { exact: true }).waitFor();
        const secondGap = page.locator('input[aria-label^="Gap 2"]');
        await secondGap.fill('at');
        await secondGap.press('Enter');
        assert.equal(await secondGap.inputValue(), 'ATP');

        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedFillGapAnswer, {
          questionId: FILL_GAP_QUESTION_ID,
          response: {
            answers: [
              { gapId: 1, answer: 'mitochondria' },
              { gapId: 2, answer: 'ATP' },
            ],
          },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      let submittedMatchingAnswer = null;

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route(`**/api/v1/quizzes/${QUIZ_ID}`, (route) => fulfillJson(route, quiz));
        await page.route(`**/api/v1/attempts/${MATCHING_ATTEMPT_ID}/current-question`, (route) => fulfillJson(route, {
          question: matchingQuestion,
          questionNumber: 1,
          totalQuestions: 1,
          attemptStatus: 'IN_PROGRESS',
        }));
        await page.route(`**/api/v1/attempts/${MATCHING_ATTEMPT_ID}/stats`, (route) => fulfillJson(route, {
          attemptId: MATCHING_ATTEMPT_ID,
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
        await page.route(`**/api/v1/attempts/${MATCHING_ATTEMPT_ID}/answers`, async (route) => {
          submittedMatchingAnswer = JSON.parse(route.request().postData() ?? '{}');
          await fulfillJson(route, {
            answerId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
            questionId: MATCHING_QUESTION_ID,
            isCorrect: true,
            score: 4,
            answeredAt: '2026-01-01T00:00:01Z',
            correctAnswer: {
              pairs: [
                { leftId: 1, rightId: 1 },
                { leftId: 2, rightId: 2 },
                { leftId: 3, rightId: 3 },
                { leftId: 4, rightId: 4 },
              ],
            },
            explanation: 'Each organelle has a distinct cellular function.',
            nextQuestion: null,
          });
        });
        await page.route(`**/api/v1/attempts/${MATCHING_ATTEMPT_ID}`, (route) => fulfillJson(route, {
          attemptId: MATCHING_ATTEMPT_ID,
          quizId: QUIZ_ID,
          userId: USER_ID,
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: null,
          status: 'IN_PROGRESS',
          mode: 'ONE_BY_ONE',
          answers: [],
        }));

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${MATCHING_ATTEMPT_ID}`,
        );
        await page.getByText('0 of 4 matches completed', { exact: true }).waitFor();

        const matchPair = async (leftText, rightText) => {
          await page.getByRole('button', { name: new RegExp(leftText) }).click();
          await page.getByRole('button', { name: new RegExp(rightText) }).click();
        };

        await matchPair('Mitochondria', 'Energy production');
        await page.getByText('1 of 4 matches completed', { exact: true }).waitFor();
        await page.getByRole('button', { name: /Energy production/ }).click();
        await page.getByText('0 of 4 matches completed', { exact: true }).waitFor();

        await matchPair('Mitochondria', 'Energy production');
        await matchPair('Ribosome', 'Protein synthesis');
        await matchPair('Nucleus', 'Genetic information storage');
        await matchPair('Golgi apparatus', 'Protein packaging and modification');
        await page.getByText('4 of 4 matches completed', { exact: true }).waitFor();
        await page.getByRole('button', { name: /Nucleus/ }).click();
        await page.getByText('3 of 4 matches completed', { exact: true }).waitFor();
        await matchPair('Nucleus', 'Genetic information storage');
        await page.getByText('4 of 4 matches completed', { exact: true }).waitFor();

        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByText('Correct answers', { exact: true }).waitFor();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.ok(submittedMatchingAnswer);
        assert.deepEqual({
          ...submittedMatchingAnswer,
          response: {
            ...submittedMatchingAnswer.response,
            matches: [...submittedMatchingAnswer.response.matches]
              .sort((first, second) => first.leftId - second.leftId),
          },
        }, {
          questionId: MATCHING_QUESTION_ID,
          response: {
            matches: [
              { leftId: 1, rightId: 1 },
              { leftId: 2, rightId: 2 },
              { leftId: 3, rightId: 3 },
              { leftId: 4, rightId: 4 },
            ],
          },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      let submittedMultiChoiceAnswer = null;

      try {
        await installSingleQuestionAttemptMocks(page, {
          attemptId: MCQ_MULTI_ATTEMPT_ID,
          question: multiChoiceQuestion,
          onAnswer: async (route) => {
            submittedMultiChoiceAnswer = JSON.parse(route.request().postData() ?? '{}');
            await fulfillJson(route, {
              answerId: '11111111-aaaa-4aaa-8aaa-111111111111',
              questionId: MCQ_MULTI_QUESTION_ID,
              isCorrect: true,
              score: 2,
              answeredAt: '2026-01-01T00:00:01Z',
              correctAnswer: { correctOptionIds: ['a', 'c'] },
              explanation: 'Unique passwords and multi-factor authentication protect accounts.',
              nextQuestion: null,
            });
          },
        });

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${MCQ_MULTI_ATTEMPT_ID}`,
        );
        const submit = page.getByRole('button', { name: 'Submit Answer' });
        assert.equal(await submit.isDisabled(), true, 'An unanswered question must remain blocked');
        const inactive = await submit.evaluate(element => {
          const style = getComputedStyle(element);
          const probe = document.createElement('span');
          probe.style.backgroundColor = 'var(--color-control-primary-disabled-fill)';
          document.body.append(probe);
          const expectedFill = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return { fill: style.backgroundColor, expectedFill, opacity: style.opacity };
        });
        assert.equal(inactive.fill, inactive.expectedFill, 'Submit Answer retains its subdued primary appearance');
        assert.equal(inactive.opacity, '1', 'The text must retain its independent contrast');
        await page.getByRole('checkbox', { name: 'Select option A' }).check();
        await page.getByRole('checkbox', { name: 'Select option C' }).check();
        assert.equal(await submit.isDisabled(), false, 'Selecting a valid answer enables submission');
        await submit.click();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedMultiChoiceAnswer, {
          questionId: MCQ_MULTI_QUESTION_ID,
          response: { selectedOptionIds: ['a', 'c'] },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      let submittedTrueFalseAnswer = null;

      try {
        await installSingleQuestionAttemptMocks(page, {
          attemptId: TRUE_FALSE_ATTEMPT_ID,
          question: trueFalseQuestion,
          onAnswer: async (route) => {
            submittedTrueFalseAnswer = JSON.parse(route.request().postData() ?? '{}');
            await fulfillJson(route, {
              answerId: '22222222-aaaa-4aaa-8aaa-222222222222',
              questionId: TRUE_FALSE_QUESTION_ID,
              isCorrect: true,
              score: 1,
              answeredAt: '2026-01-01T00:00:01Z',
              correctAnswer: { answer: false },
              explanation: 'Passwords must never be shared.',
              nextQuestion: null,
            });
          },
        });

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${TRUE_FALSE_ATTEMPT_ID}`,
        );
        await page.getByRole('button', { name: /False/ }).click();
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedTrueFalseAnswer, {
          questionId: TRUE_FALSE_QUESTION_ID,
          response: { answer: false },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      let submittedComplianceAnswer = null;

      try {
        await installSingleQuestionAttemptMocks(page, {
          attemptId: COMPLIANCE_ATTEMPT_ID,
          question: complianceQuestion,
          onAnswer: async (route) => {
            submittedComplianceAnswer = JSON.parse(route.request().postData() ?? '{}');
            await fulfillJson(route, {
              answerId: '33333333-aaaa-4aaa-8aaa-333333333333',
              questionId: COMPLIANCE_QUESTION_ID,
              isCorrect: true,
              score: 2,
              answeredAt: '2026-01-01T00:00:01Z',
              correctAnswer: { compliantIds: [1, 3] },
              explanation: 'Consent and clear opt-out mechanisms are required.',
              nextQuestion: null,
            });
          },
        });

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${COMPLIANCE_ATTEMPT_ID}`,
        );
        await page.locator('label').filter({ hasText: 'Obtain explicit consent' }).locator('input').check();
        await page.locator('label').filter({ hasText: 'Allow recipients to unsubscribe' }).locator('input').check();
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedComplianceAnswer, {
          questionId: COMPLIANCE_QUESTION_ID,
          response: { selectedStatementIds: [1, 3] },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      let submittedOrderingAnswer = null;

      try {
        await installSingleQuestionAttemptMocks(page, {
          attemptId: ORDERING_ATTEMPT_ID,
          question: orderingQuestion,
          onAnswer: async (route) => {
            submittedOrderingAnswer = JSON.parse(route.request().postData() ?? '{}');
            await fulfillJson(route, {
              answerId: '44444444-aaaa-4aaa-8aaa-444444444444',
              questionId: ORDERING_QUESTION_ID,
              isCorrect: true,
              score: 3,
              answeredAt: '2026-01-01T00:00:01Z',
              correctAnswer: { order: [1, 2, 3] },
              explanation: 'Review precedes approval, which precedes deployment.',
              nextQuestion: null,
            });
          },
        });

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${ORDERING_ATTEMPT_ID}`,
        );
        await page.locator('[draggable="true"]').filter({ hasText: 'Review the proposed changes' }).getByTitle('Move up').click();
        await page.locator('[draggable="true"]').filter({ hasText: 'Approve the release candidate' }).getByTitle('Move up').click();
        await page.getByText(/Current Order:.*Review the proposed changes.*Approve the release candidate.*Deploy the approved release/).waitFor();
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedOrderingAnswer, {
          questionId: ORDERING_QUESTION_ID,
          response: { orderedItemIds: [1, 2, 3] },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      let submittedHotspotAnswer = null;

      try {
        await installSingleQuestionAttemptMocks(page, {
          attemptId: HOTSPOT_ATTEMPT_ID,
          question: hotspotQuestion,
          onAnswer: async (route) => {
            submittedHotspotAnswer = JSON.parse(route.request().postData() ?? '{}');
            await fulfillJson(route, {
              answerId: '55555555-aaaa-4aaa-8aaa-555555555555',
              questionId: HOTSPOT_QUESTION_ID,
              isCorrect: true,
              score: 1,
              answeredAt: '2026-01-01T00:00:01Z',
              correctAnswer: { correctRegionId: 1 },
              explanation: 'The first highlighted region is the secure area.',
              nextQuestion: null,
            });
          },
        });

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${HOTSPOT_ATTEMPT_ID}`,
        );
        await page.getByRole('button', { name: 'Select region 2' }).click();
        await page.getByText('Region 2 selected', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Clear Selection' }).click();
        await page.getByText('No region selected', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Select region 1' }).click();
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByText('Explanation', { exact: true }).waitFor();

        assert.deepEqual(submittedHotspotAnswer, {
          questionId: HOTSPOT_QUESTION_ID,
          response: { selectedRegionId: 1 },
          includeCorrectness: true,
          includeCorrectAnswer: true,
          includeExplanation: true,
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      const proPackId = '60606060-6060-4060-8060-606060606060';
      let checkoutRequest = null;
      let packRequestCount = 0;
      let requestedProductionCheckout = false;

      try {
        page.on('request', (request) => {
          if (new URL(request.url()).hostname === 'checkout.stripe.com') {
            requestedProductionCheckout = true;
          }
        });
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/billing/balance', (route) => fulfillJson(route, {
          userId: USER_ID,
          availableTokens: 1200,
          reservedTokens: 100,
          updatedAt: '2026-01-01T00:00:00Z',
        }));
        await page.route('**/api/v1/billing/packs', (route) => {
          packRequestCount += 1;
          return fulfillJson(route, [
            {
              id: '60606061-6060-4060-8060-606060606060',
              name: 'Starter',
              description: 'A small token top-up.',
              tokens: 500,
              priceCents: 500,
              currency: 'GBP',
              stripePriceId: 'price_test_starter',
            },
            {
              id: proPackId,
              name: 'Pro',
              description: 'A larger token top-up.',
              tokens: 2000,
              priceCents: 1500,
              currency: 'GBP',
              stripePriceId: 'price_test_pro',
            },
          ]);
        });
        await page.route('**/api/v1/billing/transactions**', (route) => fulfillJson(route, {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 1000,
          number: 0,
          first: true,
          last: true,
          empty: true,
        }));
        await page.route('**/api/v1/billing/checkout-sessions', async (route) => {
          checkoutRequest = JSON.parse(route.request().postData() ?? '{}');
          await fulfillJson(route, {
            url: 'https://checkout.example.test/session/cs_test_e2e',
            sessionId: 'cs_test_e2e',
          });
        });
        await page.route('https://checkout.example.test/**', (route) => route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><title>Mock checkout</title><h1>Mock checkout</h1>',
        }));

        await navigateToAppRoute(page, '/billing');
        await page.getByRole('heading', { name: 'Billing & Tokens' }).waitFor();
        await page.getByText('1,200', { exact: true }).waitFor();
        await page.getByRole('button', { name: /Select Pro pack/ }).click();
        await page.getByRole('button', { name: 'Top up tokens' }).click();
        await page.waitForURL('https://checkout.example.test/**');

        assert.equal(packRequestCount, 2);
        assert.equal(requestedProductionCheckout, false);
        assert.equal(page.url(), 'https://checkout.example.test/session/cs_test_e2e');
        assert.deepEqual(checkoutRequest, {
          packId: proPackId,
          priceId: 'price_test_pro',
        });
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser)).newPage();
      const updateRequests = new Map();

      try {
        await page.addInitScript(() => {
          localStorage.setItem('accessToken', 'e2e-access-token');
          localStorage.setItem('refreshToken', 'e2e-refresh-token');
        });
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/questions**', async (route) => {
          const request = route.request();
          const requestUrl = new URL(request.url());
          const questionId = requestUrl.pathname.split('/').at(-1);
          const question = editableQuestions.find((candidate) => candidate.id === questionId);

          if (request.method() === 'GET' && requestUrl.pathname === '/api/v1/questions') {
            await fulfillJson(route, {
              content: editableQuestions,
              totalPages: 1,
              totalElements: editableQuestions.length,
              size: 20,
              number: 0,
              first: true,
              last: true,
              empty: false,
            });
            return;
          }

          if (request.method() === 'GET' && question) {
            await fulfillJson(route, question);
            return;
          }

          if (request.method() === 'PATCH' && question) {
            const update = JSON.parse(request.postData() ?? '{}');
            updateRequests.set(question.id, update);
            await fulfillJson(route, { ...question, ...update });
            return;
          }

          await route.abort('blockedbyclient');
        });

        await navigateToAppRoute(page, '/questions');
        await page.getByRole('heading', { name: 'Question Management' }).waitFor();

        for (const question of editableQuestions) {
          const updatedExplanation = `Updated ${question.type} explanation.`;
          const questionCard = page.locator('li').filter({ hasText: question.questionText });

          await questionCard.getByRole('button', { name: 'Edit' }).click();
          const explanationInput = page.locator('textarea[placeholder="Provide an explanation for the correct answer..."]');
          await explanationInput.fill(updatedExplanation);

          const updateResponse = page.waitForResponse((response) =>
            response.request().method() === 'PATCH'
            && new URL(response.url()).pathname.endsWith(`/questions/${question.id}`),
          );
          await page.getByRole('button', { name: 'Update Question' }).click();
          await updateResponse;

          assert.deepEqual(updateRequests.get(question.id), {
            type: question.type,
            difficulty: question.difficulty,
            questionText: question.questionText,
            content: question.content,
            hint: question.hint,
            explanation: updatedExplanation,
            tagIds: [],
          });
        }
      } finally {
        await page.close();
      }
    }

    {
      const page = await (await createTestContext(browser, { viewport: { width: 390, height: 844 } })).newPage();
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

        await navigateToAppRoute(
          page,
          `/quizzes/${QUIZ_ID}/attempt?attemptId=${ATTEMPT_ID}`,
        );
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


test('authoring navigation guards preserve input on desktop and mobile', { timeout: 90_000 }, async () => {
  const screenshotDir = await mkdtemp(join(tmpdir(), 'quizmaker-navigation-'));
  const server = process.env.RELEASE_BASE_URL ? null : createDevServer();
  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();
    // #207: use real browser history and native reload prompts with local APIs.
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      const context = await createTestContext(browser, { viewport });
      const page = await context.newPage();
      let savedQuiz = { ...quiz };
      let failQuestionSave = true;
      const savedQuestions = [];
      try {
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/auth/login', (route) => fulfillJson(route, tokens));
        await page.route('**/api/v1/quizzes**', async (route) => {
          const path = new URL(route.request().url()).pathname;
          if (path.endsWith('/leaderboard')) return fulfillJson(route, []);
          if (path.endsWith('/results')) return fulfillJson(route, null);
          if (path.endsWith('/status')) return fulfillJson(route, savedQuiz);
          if (path === `/api/v1/quizzes/${QUIZ_ID}`) {
            if (route.request().method() === 'PATCH') {
              savedQuiz = { ...savedQuiz, ...JSON.parse(route.request().postData() ?? '{}') };
            }
            return fulfillJson(route, savedQuiz);
          }
          return fulfillJson(route, { content: [], totalPages: 0, totalElements: 0, number: 0, size: 10, empty: true });
        });
        await page.route('**/api/v1/questions**', async (route) => {
          if (route.request().method() === 'POST') {
            if (failQuestionSave) {
              failQuestionSave = false;
              return fulfillJson(route, { message: 'Fixture question save failed' }, 503);
            }
            savedQuestions.push({ ...editableQuestions[2], id: QUESTION_ID, questionText: 'Unsaved browser question', quizIds: [QUIZ_ID] });
            return fulfillJson(route, { questionId: QUESTION_ID });
          }
          if (new URL(route.request().url()).pathname.endsWith(`/${QUESTION_ID}`)) return fulfillJson(route, savedQuestions[0]);
          return fulfillJson(route, { content: savedQuestions, totalPages: savedQuestions.length ? 1 : 0, totalElements: savedQuestions.length, number: 0, size: 50, empty: savedQuestions.length === 0 });
        });

        await navigateToAppRoute(page, `/quizzes/${QUIZ_ID}/questions`);
        await page.getByLabel('Username or Email').waitFor();
        await fillLoginForm(page);
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.waitForURL(`${BASE_URL}/quizzes/${QUIZ_ID}?tab=questions`);
        await page.getByRole('tab', { name: 'Questions', exact: true }).waitFor();
        assert.equal(await page.getByRole('tab', { name: 'Questions', exact: true }).getAttribute('aria-selected'), 'true');
        assert.equal(await page.evaluate(() => window.history.state.usr), null);

        await page.getByRole('tab', { name: 'Settings', exact: true }).click();
        await page.getByLabel('Quiz Title', { exact: true }).fill('Unsaved navigation quiz');
        await page.getByRole('tab', { name: 'Questions', exact: true }).click();
        assert.equal(await page.getByRole('dialog').count(), 0, 'Settings tab navigation preserves the draft');
        await page.goBack();
        await page.getByLabel('Quiz Title', { exact: true }).waitFor();
        assert.equal(await page.getByLabel('Quiz Title', { exact: true }).inputValue(), 'Unsaved navigation quiz');
        await page.goForward();
        await page.getByRole('tab', { name: 'Questions', exact: true }).waitFor();
        assert.equal(await page.getByRole('tab', { name: 'Questions', exact: true }).getAttribute('aria-selected'), 'true');
        await page.getByRole('tab', { name: 'Settings', exact: true }).click();
        if (viewport.width < 640) await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
        await page.getByRole('banner').getByRole('link', { name: 'My Quizzes', exact: true }).click();
        await page.getByRole('dialog', { name: 'Leave without saving?' }).waitFor();
        await page.getByRole('button', { name: 'Stay', exact: true }).click();
        assert.equal(await page.getByLabel('Quiz Title', { exact: true }).inputValue(), 'Unsaved navigation quiz');
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
        await page.getByRole('button', { name: 'Save Changes', exact: true }).waitFor();
        await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Save Changes' && button.disabled));
        await page.getByRole('tab', { name: 'Questions', exact: true }).click();

        await page.getByRole('button', { name: 'Add Question', exact: true }).first().click();
        await page.getByRole('button', { name: /True.*False/ }).click();
        const editorClose = page.getByRole('dialog').getByRole('button', { name: 'Close modal' });
        const closeBounds = await editorClose.boundingBox();
        assert.ok(closeBounds && closeBounds.width >= 44 && closeBounds.height >= 44, 'Shared close button is usable by touch');
        await page.getByLabel('Question Text', { exact: true }).fill('Unsaved browser question');
        await page.keyboard.press('Escape');
        const warning = page.getByRole('dialog', { name: 'Leave without saving?' });
        await warning.waitFor();
        await page.screenshot({ path: join(screenshotDir, `modal-${viewport.width}.png`) });
        const bounds = await warning.boundingBox();
        assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width, 'Confirmation fits the viewport');
        await page.keyboard.press('Escape');
        assert.equal(await page.getByLabel('Question Text', { exact: true }).inputValue(), 'Unsaved browser question');

        const back = page.goBack();
        await warning.waitFor();
        await page.getByRole('button', { name: 'Stay', exact: true }).click();
        await back;

        const unloadDialog = page.waitForEvent('dialog');
        const reloadAttempt = page.evaluate(() => window.location.reload());
        const dialog = await unloadDialog;
        assert.equal(dialog.type(), 'beforeunload');
        await dialog.dismiss();
        await reloadAttempt;
        assert.equal(await page.getByLabel('Question Text', { exact: true }).inputValue(), 'Unsaved browser question');
        await page.getByRole('button', { name: 'Create Question', exact: true }).click();
        await page.getByText('Failed to save question', { exact: true }).waitFor();
        await page.keyboard.press('Escape');
        await warning.waitFor();
        await page.getByRole('button', { name: 'Stay', exact: true }).click();
        await page.getByRole('button', { name: 'Save & Add Another', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('textarea[placeholder="Enter your question here..."]')?.value === '');
        await page.keyboard.press('Escape');
        await page.getByRole('dialog').waitFor({ state: 'hidden' });

        if (viewport.width < 640) await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
        await page.getByRole('banner').getByRole('link', { name: 'My Quizzes', exact: true }).click();
        await page.waitForURL(`${BASE_URL}/my-quizzes`);
        assert.equal(await page.getByRole('dialog').count(), 0, 'Saved settings and reset question are clean');
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await stopDevServer(server);
    await rm(screenshotDir, { recursive: true, force: true });
  }
});

test('confirmation design follows themes and balances responsive actions', { timeout: 120_000 }, async () => {
  const screenshotDir = process.env.E2E_SCREENSHOT_DIR ?? await mkdtemp(join(tmpdir(), 'quizmaker-dialog-design-'));
  await mkdir(screenshotDir, { recursive: true });
  const server = process.env.RELEASE_BASE_URL ? null : createDevServer();
  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();
    const scenarios = ['light', 'dark', 'blue', 'purple', 'green'].flatMap(palette =>
      [1280, 390].map(width => ({ palette, width })));
    // 640 CSS pixels also represents a 1280 px viewport at 200% browser zoom.
    scenarios.push({ palette: 'light', width: 320 }, { palette: 'light', width: 640 });
    for (const { palette, width } of scenarios) {
      const context = await createTestContext(browser, { viewport: { width, height: 900 } });
      try {
        await context.addInitScript((scheme) => {
          localStorage.setItem('quizmaker-theme', scheme === 'dark' || scheme === 'purple' ? 'dark' : 'light');
          localStorage.setItem('quizmaker-color-scheme', scheme);
        }, palette);
        const page = await context.newPage();
        await installUnexpectedApiBlock(page);
        await installAuthMeMock(page);
        await page.route('**/api/v1/auth/login', route => fulfillJson(route, tokens));
        await page.route('**/api/v1/quizzes**', route => fulfillJson(route,
          new URL(route.request().url()).pathname === `/api/v1/quizzes/${QUIZ_ID}`
            ? quiz : { content: [], totalPages: 0, totalElements: 0, number: 0, size: 10, empty: true }));
        await page.route('**/api/v1/questions**', route => fulfillJson(route,
          { content: [], totalPages: 0, totalElements: 0, number: 0, size: 50, empty: true }));
        await navigateToAppRoute(page, `/quizzes/${QUIZ_ID}?tab=questions`);
        await fillLoginForm(page);
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.getByRole('tab', { name: 'Settings', exact: true }).click();
        await page.getByLabel('Quiz Title', { exact: true }).fill('Unsaved design fixture');
        const menuToggle = page.getByRole('button', { name: 'Toggle navigation menu' });
        if (await menuToggle.isVisible()) await menuToggle.click();
        await page.getByRole('banner').getByRole('link', { name: 'My Quizzes', exact: true }).click();
        const warning = page.getByRole('dialog', { name: 'Leave without saving?' });
        await warning.waitFor();
        const stay = warning.getByRole('button', { name: 'Stay', exact: true });
        const leave = warning.getByRole('button', { name: 'Leave without saving', exact: true });
        await page.waitForFunction(() => document.activeElement?.textContent === 'Stay');
        const layout = await warning.evaluate(dialog => {
          const buttons = [...dialog.querySelectorAll('button')];
          const actions = buttons[0].parentElement;
          const content = actions.parentElement.parentElement;
          const message = dialog.querySelector('p');
          const header = dialog.querySelector('h3').parentElement;
          const box = element => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return { x, y, width, height };
          };
          const themeColor = token => {
            const probe = document.createElement('span');
            probe.style.color = `var(${token})`;
            dialog.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          };
          return {
            panel: box(dialog), actions: box(actions), buttons: buttons.map(box),
            message: box(message), content: box(content),
            padding: Number.parseFloat(getComputedStyle(content).paddingLeft),
            headerPadding: Number.parseFloat(getComputedStyle(header).paddingLeft),
            panelColor: getComputedStyle(dialog).backgroundColor,
            actionsColor: getComputedStyle(actions).backgroundColor,
            messageColor: getComputedStyle(message).color,
            confirmColor: getComputedStyle(buttons[1]).backgroundColor,
            cancelColor: getComputedStyle(buttons[0]).backgroundColor,
            themeSurface: themeColor('--color-bg-primary'),
            themeMessage: themeColor('--color-text-secondary'),
            themePrimary: themeColor('--color-control-primary-default-fill'),
            scheme: document.documentElement.classList.contains(`theme-${localStorage.getItem('quizmaker-color-scheme')}`),
            horizontalOverflow: dialog.scrollWidth > dialog.clientWidth,
          };
        });
        const label = `${palette} at ${width}px`;
        assert.ok(layout.scheme, label);
        assert.equal(layout.panelColor, layout.themeSurface, `${label}: shared theme surface`);
        assert.equal(layout.actionsColor, 'rgba(0, 0, 0, 0)', `${label}: no colored action strip`);
        assert.equal(layout.cancelColor, 'rgba(0, 0, 0, 0)', `${label}: quiet outline cancellation`);
        assert.equal(layout.messageColor, layout.themeMessage, `${label}: readable theme message`);
        assert.equal(layout.confirmColor, layout.themePrimary, `${label}: shared primary action`);
        assert.equal(layout.padding, layout.headerPadding, `${label}: consistent header/body inset`);
        assert.ok(!layout.horizontalOverflow, `${label}: no horizontal overflow`);
        assert.ok(layout.panel.x >= 0 && layout.panel.x + layout.panel.width <= width, `${label}: panel fits`);
        const [cancelBox, confirmBox] = layout.buttons;
        assert.ok(cancelBox.height >= 44 && confirmBox.height >= 44, `${label}: touch targets`);
        assert.ok(Math.abs(cancelBox.width - confirmBox.width) < 1, `${label}: equal action widths`);
        assert.ok(Math.abs(cancelBox.x - layout.content.x - layout.padding) < 1, `${label}: one layer of body spacing`);
        assert.ok(Math.abs(confirmBox.x + confirmBox.width - layout.actions.x - layout.actions.width) < 1, `${label}: actions fill content`);
        if (width >= 640) {
          assert.ok(cancelBox.x < confirmBox.x && Math.abs(cancelBox.y - confirmBox.y) < 1, `${label}: safe action first in balanced row`);
        } else {
          assert.ok(cancelBox.y + cancelBox.height <= confirmBox.y, `${label}: safe action first in stack`);
        }
        await page.keyboard.press('Tab');
        assert.ok(await leave.evaluate(button => button === document.activeElement), `${label}: keyboard follows visual order`);
        await page.keyboard.press('Tab');
        assert.ok(await stay.evaluate(button => button === document.activeElement), `${label}: focus stays in dialog`);
        await page.screenshot({ path: join(screenshotDir, `${palette}-${width}.png`) });
        await page.keyboard.press('Escape');
        assert.equal(await page.getByLabel('Quiz Title', { exact: true }).inputValue(), 'Unsaved design fixture');
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await stopDevServer(server);
    if (!process.env.E2E_SCREENSHOT_DIR) await rm(screenshotDir, { recursive: true, force: true });
  }
});
