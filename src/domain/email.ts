const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function isValidEmail(input: string): boolean {
  return EMAIL_PATTERN.test(input.trim());
}
