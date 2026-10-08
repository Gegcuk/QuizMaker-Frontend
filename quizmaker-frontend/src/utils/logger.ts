import { diagnostics } from '@/features/diagnostics/reporter';

/** Legacy call sites remain compatible; arbitrary log arguments are discarded. */
export const logger = {
  debug(...args: unknown[]): void { void args; /* Production and development debug output is disabled. */ },
  info(...args: unknown[]): void { void args; /* No free-form operational logging. */ },
  warn(...args: unknown[]): void { void args; diagnostics.report(undefined, 'application'); },
  error(...args: unknown[]): void { void args; diagnostics.report(undefined, 'application'); },
};
