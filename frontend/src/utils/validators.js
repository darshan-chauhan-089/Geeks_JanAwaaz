/** Client-side field validators — mirror the express-validator rules in the backend. */

export const validators = {
  /** Non-empty string */
  required: (value, label = 'This field') => {
    if (!value || !String(value).trim()) return `${label} is required.`;
    return null;
  },

  /** Valid email address */
  email: (value) => {
    if (!value) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
    return null;
  },

  /**
   * Password strength:
   *   – min 8 chars
   *   – at least one letter and one number
   */
  password: (value) => {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter.';
    if (!/\d/.test(value)) return 'Password must contain at least one number.';
    return null;
  },

  /** Confirm password matches */
  confirmPassword: (value, original) => {
    if (!value) return 'Please confirm your password.';
    if (value !== original) return 'Passwords do not match.';
    return null;
  },

  /** Non-empty, max-length string */
  maxLength: (value, max, label = 'This field') => {
    if (value && value.length > max) return `${label} must be at most ${max} characters.`;
    return null;
  },

  /** Integer within [min, max] range */
  intRange: (value, min, max, label = 'Value') => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return `${label} must be a number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return null;
  },

  /**
   * Run a record of validators and return the first error per field.
   * @param {Record<string, () => string|null>} rules  — { fieldName: () => errorOrNull }
   * @returns {Record<string, string>}
   */
  runAll: (rules) => {
    const errors = {};
    for (const [field, check] of Object.entries(rules)) {
      const err = check();
      if (err) errors[field] = err;
    }
    return errors;
  },
};
