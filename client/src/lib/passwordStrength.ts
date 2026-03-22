export type PasswordStrength = "weak" | "medium" | "strong";

export function getPasswordStrength(password: string): { strength: PasswordStrength; score: number } {
  const p = password ?? "";
  let score = 0;

  if (p.length >= 8) score += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^A-Za-z0-9]/.test(p)) score += 1;

  if (score >= 3) return { strength: "strong", score };
  if (score === 2) return { strength: "medium", score };
  return { strength: "weak", score };
}

