export const isValidUrl = (text: string) => {
  try {
    new URL(text);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error: unknown) {
    return false;
  }
};
