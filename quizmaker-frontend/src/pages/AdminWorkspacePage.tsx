import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  ConfirmationModal,
  Input,
  Modal,
  PageContainer,
  Spinner,
  Textarea,
  useToast,
} from '@/components';
import { adminService } from '@/features/admin';
import { useAuth } from '@/features/auth';
import { Seo } from '@/features/seo';
import type {
  EmailProviderStatus,
  PendingReviewQuizDto,
  QuizModerationAuditDto,
} from '@/types';

type EmailAction = 'password-reset' | 'verification';
type ModerationAction = 'approve' | 'reject' | 'unpublish';

type PendingModerationAction = {
  action: ModerationAction;
  quiz: PendingReviewQuizDto;
};

const EMAIL_DIAGNOSTIC_ROLES = ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const moderationActionConfig: Record<ModerationAction, {
  title: string;
  confirmText: string;
  reasonLabel: string;
  requiresReason: boolean;
}> = {
  approve: {
    title: 'Approve quiz',
    confirmText: 'Approve quiz',
    reasonLabel: 'Approval note',
    requiresReason: false,
  },
  reject: {
    title: 'Reject quiz',
    confirmText: 'Reject quiz',
    reasonLabel: 'Rejection reason',
    requiresReason: true,
  },
  unpublish: {
    title: 'Unpublish quiz',
    confirmText: 'Unpublish quiz',
    reasonLabel: 'Unpublish note',
    requiresReason: false,
  },
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const AdminWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userRoles = user?.roles ?? [];
  const canViewEmailDiagnostics = userRoles.some((role) => EMAIL_DIAGNOSTIC_ROLES.includes(role));

  const [error, setError] = useState<string | null>(null);
  const [emailProviderStatus, setEmailProviderStatus] = useState<EmailProviderStatus | null>(null);
  const [isEmailProviderLoading, setIsEmailProviderLoading] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email ?? '');
  const [pendingEmailAction, setPendingEmailAction] = useState<EmailAction | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [organizationId, setOrganizationId] = useState('');
  const [pendingQuizzes, setPendingQuizzes] = useState<PendingReviewQuizDto[]>([]);
  const [hasLoadedQueue, setHasLoadedQueue] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [auditsByQuizId, setAuditsByQuizId] = useState<Record<string, QuizModerationAuditDto[]>>({});
  const [expandedAuditQuizId, setExpandedAuditQuizId] = useState<string | null>(null);
  const [auditLoadingQuizId, setAuditLoadingQuizId] = useState<string | null>(null);
  const [pendingModerationAction, setPendingModerationAction] = useState<PendingModerationAction | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);

  const loadEmailProviderStatus = useCallback(async () => {
    setIsEmailProviderLoading(true);
    setError(null);

    try {
      setEmailProviderStatus(await adminService.getEmailProviderStatus());
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load email provider status.'));
    } finally {
      setIsEmailProviderLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewEmailDiagnostics) {
      setEmailProviderStatus(null);
      return;
    }

    void loadEmailProviderStatus();
  }, [canViewEmailDiagnostics, loadEmailProviderStatus]);

  useEffect(() => {
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [user?.email]);

  const loadPendingReviewQuizzes = useCallback(async () => {
    const normalizedOrganizationId = organizationId.trim();
    if (!UUID_PATTERN.test(normalizedOrganizationId)) {
      setError('Enter a valid organization UUID before loading the review queue.');
      return;
    }

    setIsQueueLoading(true);
    setError(null);

    try {
      setPendingQuizzes(await adminService.getPendingReviewQuizzes(normalizedOrganizationId));
      setHasLoadedQueue(true);
      setExpandedAuditQuizId(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load quizzes awaiting review.'));
      setHasLoadedQueue(false);
    } finally {
      setIsQueueLoading(false);
    }
  }, [organizationId]);

  const requestTestEmail = (action: EmailAction) => {
    if (!EMAIL_PATTERN.test(testEmail.trim())) {
      setError('Enter a valid recipient email address.');
      return;
    }

    setError(null);
    setPendingEmailAction(action);
  };

  const sendTestEmail = async () => {
    if (!pendingEmailAction) {
      return;
    }

    setIsSendingEmail(true);
    setError(null);

    try {
      const message = pendingEmailAction === 'password-reset'
        ? await adminService.testPasswordResetEmail(testEmail.trim())
        : await adminService.testVerificationEmail(testEmail.trim());
      addToast({ type: 'success', message });
      setPendingEmailAction(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to send the test email.'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const toggleAuditTrail = async (quizId: string) => {
    if (expandedAuditQuizId === quizId) {
      setExpandedAuditQuizId(null);
      return;
    }

    setExpandedAuditQuizId(quizId);
    if (Object.prototype.hasOwnProperty.call(auditsByQuizId, quizId)) {
      return;
    }

    setAuditLoadingQuizId(quizId);
    setError(null);

    try {
      const audits = await adminService.getQuizModerationAudits(quizId);
      setAuditsByQuizId((current) => ({ ...current, [quizId]: audits }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load the moderation audit trail.'));
      setExpandedAuditQuizId(null);
    } finally {
      setAuditLoadingQuizId(null);
    }
  };

  const openModerationAction = (quiz: PendingReviewQuizDto, action: ModerationAction) => {
    setModerationReason('');
    setModerationError(null);
    setPendingModerationAction({ quiz, action });
  };

  const confirmModerationAction = async () => {
    if (!pendingModerationAction) {
      return;
    }

    const { action, quiz } = pendingModerationAction;
    const reason = moderationReason.trim();
    if (moderationActionConfig[action].requiresReason && !reason) {
      setModerationError('A rejection reason is required.');
      return;
    }

    setIsModerating(true);
    setModerationError(null);

    try {
      if (action === 'approve') {
        await adminService.approveQuiz(quiz.id, reason || undefined);
      } else if (action === 'reject') {
        await adminService.rejectQuiz(quiz.id, reason);
      } else {
        await adminService.unpublishQuiz(quiz.id, reason || undefined);
      }

      setPendingQuizzes((current) => current.filter((pendingQuiz) => pendingQuiz.id !== quiz.id));
      setExpandedAuditQuizId((current) => current === quiz.id ? null : current);
      setPendingModerationAction(null);
      addToast({ type: 'success', message: `Quiz ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'unpublished'}.` });
    } catch (requestError) {
      setModerationError(getErrorMessage(requestError, `Unable to ${action} this quiz.`));
    } finally {
      setIsModerating(false);
    }
  };

  const providerSummary = useMemo(() => {
    if (!emailProviderStatus) {
      return null;
    }

    if (emailProviderStatus.isNoop) {
      return 'No-op provider';
    }
    if (emailProviderStatus.isSes) {
      return 'Amazon SES';
    }
    if (emailProviderStatus.isSmtp) {
      return 'SMTP';
    }
    return emailProviderStatus.providerClass;
  }, [emailProviderStatus]);

  const emailConfirmationLabel = pendingEmailAction === 'password-reset'
    ? 'password-reset'
    : 'verification';
  const actionConfig = pendingModerationAction
    ? moderationActionConfig[pendingModerationAction.action]
    : null;

  return (
    <>
      <Seo title="Administration | Quizzence" noindex />
      <PageContainer
        title="Administration"
        subtitle="Diagnostics and quiz moderation"
        showBreadcrumb
      >
        <div className="space-y-8">
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          {canViewEmailDiagnostics && (
            <section className="border-b border-theme-border-primary pb-8" aria-labelledby="email-diagnostics-heading">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="email-diagnostics-heading" className="text-lg font-semibold text-theme-text-primary">
                    Email diagnostics
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadEmailProviderStatus()}
                  loading={isEmailProviderLoading}
                  aria-label="Refresh email provider status"
                >
                  Refresh
                </Button>
              </div>

              {isEmailProviderLoading && !emailProviderStatus ? (
                <div className="flex justify-center py-6">
                  <Spinner size="md" />
                </div>
              ) : emailProviderStatus ? (
                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Provider</dt>
                    <dd className="mt-1 text-sm font-medium text-theme-text-primary">{providerSummary}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Implementation</dt>
                    <dd className="mt-1 break-words text-sm text-theme-text-primary">{emailProviderStatus.providerClass}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-theme-text-tertiary">Delivery</dt>
                    <dd className="mt-1 text-sm text-theme-text-primary">{emailProviderStatus.isNoop ? 'Disabled' : 'Enabled'}</dd>
                  </div>
                </dl>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <Input
                  label="Test recipient"
                  type="email"
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  fullWidth
                  autoComplete="email"
                />
                <Button
                  variant="outline"
                  onClick={() => requestTestEmail('password-reset')}
                  disabled={isSendingEmail}
                >
                  Send reset email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => requestTestEmail('verification')}
                  disabled={isSendingEmail}
                >
                  Send verification email
                </Button>
              </div>
            </section>
          )}

          <section aria-labelledby="moderation-heading">
            <div>
              <h2 id="moderation-heading" className="text-lg font-semibold text-theme-text-primary">
                Quiz moderation
              </h2>
            </div>

            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                void loadPendingReviewQuizzes();
              }}
            >
              <Input
                label="Organization UUID"
                value={organizationId}
                onChange={(event) => {
                  setOrganizationId(event.target.value);
                  setHasLoadedQueue(false);
                }}
                placeholder="00000000-0000-0000-0000-000000000000"
                fullWidth
                autoComplete="off"
              />
              <Button type="submit" loading={isQueueLoading}>
                Load review queue
              </Button>
            </form>

            {isQueueLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : hasLoadedQueue && pendingQuizzes.length === 0 ? (
              <p className="py-10 text-center text-sm text-theme-text-secondary">No quizzes currently await moderation.</p>
            ) : hasLoadedQueue ? (
              <div className="mt-6 space-y-4">
                {pendingQuizzes.map((quiz) => {
                  const isAuditExpanded = expandedAuditQuizId === quiz.id;
                  const audits = auditsByQuizId[quiz.id] ?? [];
                  const isAuditLoading = auditLoadingQuizId === quiz.id;

                  return (
                    <article key={quiz.id} className="border border-theme-border-primary bg-theme-bg-primary p-4 rounded-lg">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <h3 className="break-words font-medium text-theme-text-primary">{quiz.title}</h3>
                          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-theme-text-secondary sm:grid-cols-2">
                            <div>
                              <dt className="inline text-theme-text-tertiary">Created: </dt>
                              <dd className="inline">{formatDate(quiz.createdAt)}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="inline text-theme-text-tertiary">Creator: </dt>
                              <dd className="break-all inline">{quiz.creatorId}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void toggleAuditTrail(quiz.id)}
                            loading={isAuditLoading}
                            aria-expanded={isAuditExpanded}
                          >
                            {isAuditExpanded ? 'Hide audit' : 'View audit'}
                          </Button>
                          <Button variant="success" size="sm" onClick={() => openModerationAction(quiz, 'approve')}>
                            Approve
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => openModerationAction(quiz, 'reject')}>
                            Reject
                          </Button>
                          <Button variant="warning" size="sm" onClick={() => openModerationAction(quiz, 'unpublish')}>
                            Unpublish
                          </Button>
                        </div>
                      </div>

                      {isAuditExpanded && !isAuditLoading && (
                        <div className="mt-4 border-t border-theme-border-primary pt-4">
                          {audits.length === 0 ? (
                            <p className="text-sm text-theme-text-secondary">No moderation actions are recorded for this quiz.</p>
                          ) : (
                            <ol className="space-y-3">
                              {audits.map((audit) => (
                                <li key={audit.id} className="text-sm text-theme-text-secondary">
                                  <span className="font-medium text-theme-text-primary">{audit.action}</span>
                                  <span> · {formatDate(audit.createdAt)}</span>
                                  {audit.reason && <p className="mt-1 break-words">{audit.reason}</p>}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>
      </PageContainer>

      <ConfirmationModal
        isOpen={pendingEmailAction !== null}
        onClose={() => {
          if (!isSendingEmail) {
            setPendingEmailAction(null);
          }
        }}
        onConfirm={() => void sendTestEmail()}
        title="Send test email"
        message={`Send a ${emailConfirmationLabel} email to ${testEmail.trim()}?`}
        confirmText="Send email"
        variant="info"
        isLoading={isSendingEmail}
      />

      <Modal
        isOpen={pendingModerationAction !== null}
        onClose={() => {
          if (!isModerating) {
            setPendingModerationAction(null);
            setModerationError(null);
          }
        }}
        title={actionConfig?.title}
        size="md"
        closeOnBackdrop={!isModerating}
        closeOnEscape={!isModerating}
        showCloseButton={!isModerating}
      >
        {pendingModerationAction && actionConfig && (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void confirmModerationAction();
            }}
          >
            <p className="text-sm text-theme-text-secondary">
              {pendingModerationAction.quiz.title}
            </p>
            <Textarea
              label={actionConfig.reasonLabel}
              value={moderationReason}
              onChange={(event) => setModerationReason(event.target.value)}
              required={actionConfig.requiresReason}
              error={moderationError ?? undefined}
              rows={3}
              fullWidth
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPendingModerationAction(null)}
                disabled={isModerating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={pendingModerationAction.action === 'reject' ? 'danger' : pendingModerationAction.action === 'unpublish' ? 'warning' : 'success'}
                loading={isModerating}
              >
                {actionConfig.confirmText}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default AdminWorkspacePage;
