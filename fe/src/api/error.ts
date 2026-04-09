import axios from 'axios';

export function getApiErrorMessage(
  error: unknown,
  fallback: string = 'Request failed.'
) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getApiErrorMessageAsync(
  error: unknown,
  fallback: string = 'Request failed.'
) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof (responseData as { message?: unknown }).message === 'string'
    ) {
      return (responseData as { message: string }).message;
    }

    if (responseData instanceof Blob) {
      try {
        const rawText = await responseData.text();
        const parsed = JSON.parse(rawText) as { message?: string };
        if (parsed?.message) return parsed.message;
      } catch {
        // ignore parse failure and fallback below
      }
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
