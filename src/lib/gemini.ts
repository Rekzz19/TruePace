export const GEMINI_API_KEY: string = (() => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return key;
})();
