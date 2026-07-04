/**
 * Structured error log for unexpected controller/service failures.
 * Keeps the log line greppable (`[error]`) and never prints the raw
 * error object (which can include huge stack traces or sensitive data).
 */
export const logError = (context: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(
    `[error] ${new Date().toISOString()} ${context}: ${message}`,
    stack ? `\n${stack}` : "",
  );
};
