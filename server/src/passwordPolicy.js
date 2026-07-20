// Single source of truth for the password policy so the API always returns the
// same, specific reason (the UI surfaces this exact message).

const PREFIX = "Password does not meet policy requirements: ";

// Returns an error message string if the password is invalid, otherwise null.
export function validatePassword(password) {
  const pw = String(password || "");
  if (pw.length < 8) {
    return PREFIX + "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(pw)) {
    return PREFIX + "Password must contain at least one uppercase letter (A-Z)";
  }
  if (!/[a-z]/.test(pw)) {
    return PREFIX + "Password must contain at least one lowercase letter (a-z)";
  }
  if (!/[0-9]/.test(pw)) {
    return PREFIX + "Password must contain at least one number (0-9)";
  }
  return null;
}
