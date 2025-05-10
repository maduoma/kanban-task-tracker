const getTimestamp = (): string => new Date().toISOString();

export const info = (...args: unknown[]): void => {
  console.log(`[${getTimestamp()}] [INFO]`, ...args);
};

export const error = (...args: unknown[]): void => {
  console.error(`[${getTimestamp()}] [ERROR]`, ...args);
};

export const warn = (...args: unknown[]): void => {
  console.warn(`[${getTimestamp()}] [WARN]`, ...args);
};

export const debug = (...args: unknown[]): void => {
  // biome-ignore lint/suspicious/noConsoleLog: Debug log
  console.log(`[${getTimestamp()}] [DEBUG]`, ...args);
};

export default {
  info,
  error,
  warn,
  debug,
};
