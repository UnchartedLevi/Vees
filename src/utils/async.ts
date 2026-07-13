const transientMessages = ["failed to fetch", "networkerror", "load failed"];

export const isTransientFetchError = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return transientMessages.some((item) => message.toLowerCase().includes(item));
};

export const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function withRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await operation();
  } catch (reason) {
    if (!retries || !isTransientFetchError(reason)) throw reason;
    await wait((3 - retries) * 500);
    return withRetry(operation, retries - 1);
  }
}

