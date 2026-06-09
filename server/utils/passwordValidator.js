const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, message: 'Password must be at least 8 characters' },
  { test: (p) => /[a-z]/.test(p), message: 'Password must contain a lowercase letter' },
  { test: (p) => /[A-Z]/.test(p), message: 'Password must contain an uppercase letter' },
  { test: (p) => /\d/.test(p), message: 'Password must contain a number' },
];

export const validatePasswordStrength = (password) => {
  if (!password) return 'Password is required';
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.message;
  }
  return null;
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Weak' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak' };
  if (score <= 3) return { score, label: 'Fair' };
  if (score <= 4) return { score, label: 'Good' };
  return { score, label: 'Strong' };
};
