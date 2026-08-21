export function publicErrorMessage(error, fallback = 'Unexpected server error.') {
  if (error?.status || error?.code === 'DATABASE_URL_INVALID') {
    return error.message || fallback;
  }
  return fallback;
}
