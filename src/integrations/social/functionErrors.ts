type FunctionErrorWithContext = Error & {
  context?: Response;
};

export async function readableFunctionError(error: unknown, fallback: string) {
  const context = (error as FunctionErrorWithContext | undefined)?.context;
  if (context) {
    try {
      const payload = await context.clone().json();
      if (typeof payload?.error === "string") return payload.error;
      if (typeof payload?.message === "string") return payload.message;
    } catch {
      try {
        const text = await context.clone().text();
        if (text.trim()) return text.trim();
      } catch {
        // Fall through to the generic error handling below.
      }
    }
  }

  if (error instanceof Error && error.message !== "Edge Function returned a non-2xx status code") {
    return error.message;
  }
  return fallback;
}
