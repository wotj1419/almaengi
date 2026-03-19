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
