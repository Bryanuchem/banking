const ACCESS_KEY = "banking_admin_access_token";
const CHALLENGE_KEY = "banking_admin_2fa_challenge";
const REMEMBER_KEY = "banking_admin_remember_me";

export function getAccessToken() {
  return (
    localStorage.getItem(ACCESS_KEY) ??
    sessionStorage.getItem(ACCESS_KEY)
  );
}

export function setAccessToken(
  token: string,
  remember: boolean,
) {
  localStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(ACCESS_KEY);

  const storage = remember
    ? localStorage
    : sessionStorage;

  storage.setItem(ACCESS_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
}

export function setChallengeToken(token: string) {
  sessionStorage.setItem(CHALLENGE_KEY, token);
}

export function getChallengeToken() {
  return sessionStorage.getItem(CHALLENGE_KEY);
}

export function clearChallengeToken() {
  sessionStorage.removeItem(CHALLENGE_KEY);
}

export function setRememberPreference(value: boolean) {
  sessionStorage.setItem(REMEMBER_KEY, value ? "1" : "0");
}

export function getRememberPreference() {
  return sessionStorage.getItem(REMEMBER_KEY) === "1";
}

export function clearRememberPreference() {
  sessionStorage.removeItem(REMEMBER_KEY);
}
