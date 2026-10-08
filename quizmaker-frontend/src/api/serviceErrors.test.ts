import { describe, expect, it } from 'vitest';
import type { AxiosInstance } from 'axios';
import { createAxiosMock } from '@/test/mockAxios';
import { ApplicationError } from '@/utils/applicationError';
import { AdminService } from '@/features/admin/services/admin.service';
import { AttemptService } from '@/features/attempt/services/attempt.service';
import { AuthService } from '@/features/auth/services/auth.service';
import { BillingService } from '@/features/billing/services/billing.service';
import { BugReportService } from '@/features/bug-report/services/bug-report.service';
import { CategoryService } from '@/features/category/services/category.service';
import { DocumentService } from '@/features/document/services/document.service';
import { DocumentProcessService } from '@/features/document/services/documentProcess.service';
import { MediaService } from '@/features/media/services/media.service';
import { QuestionService } from '@/features/question/services/question.service';
import { QuizGroupService } from '@/features/quiz/services/quiz-group.service';
import { QuizService } from '@/features/quiz/services/quiz.service';
import { ResultService } from '@/features/result/services/result.service';
import { TagService } from '@/features/tag/services/tag.service';
import { UserService } from '@/features/user/services/user.service';

const calls: [string, (api: AxiosInstance) => Promise<unknown>][] = [
  ['admin', api => new AdminService(api).getAllRoles()],
  ['attempt', api => new AttemptService(api).getAttemptStats('private-id')],
  ['auth', api => new AuthService(api).getCurrentUser()],
  ['billing', api => new BillingService(api).getBalance()],
  ['bug-report', api => new BugReportService(api).listBugReports()],
  ['category', api => new CategoryService(api).getCategories()],
  ['document', api => new DocumentService(api).getDocumentById('private-id')],
  ['document-process', api => new DocumentProcessService(api).getDocumentById('private-id')],
  ['media', api => new MediaService(api).getAsset('private-id')],
  ['question', api => new QuestionService(api).getQuestionById('private-id')],
  ['quiz-group', api => new QuizGroupService(api).getQuizGroups()],
  ['quiz', api => new QuizService(api).getQuizById('private-id')],
  ['result', api => new ResultService(api).getQuizResults('private-id')],
  ['tag', api => new TagService(api).getTags()],
  ['user', api => new UserService(api).getUserProfile()],
];

describe.each(calls)('%s service error contract', (_name, call) => {
  it.each([409, 410, 412, 422, 429, 503])('preserves HTTP %i metadata without private response data', async status => {
    const api = createAxiosMock();
    const secret = 'seed-authorization-answer-document-prompt-payment-secret';
    api.get.mockRejectedValue({
      isAxiosError: true, message: secret, stack: secret,
      config: { headers: { Authorization: secret }, url: `/${secret}` },
      response: { status, headers: { 'retry-after': '10' }, data: {
        detail: secret, code: 'VALIDATION_ERROR', type: 'https://quizzence.com/docs/errors/validation-failed',
        errors: { title: [secret] }, correlationId: '01234567-0123-4123-8123-0123456789ab',
      } },
    });
    const error = await call(api.instance).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      status, retryAfterSeconds: 10, code: 'VALIDATION_ERROR',
      type: 'https://quizzence.com/docs/errors/validation-failed',
      fieldErrors: { title: ['Check this field and try again.'] },
      correlationId: '01234567-0123-4123-8123-0123456789ab',
    });
    expect(JSON.stringify(error)).not.toContain(secret);
  });
});
