/**
 * Demo-only account registry in localStorage (no server).
 * Used to block duplicate signups and validate login.
 */

export const ACCOUNTS_KEY = "lifeops-accounts";

export interface StoredAccount {
  password: string;
  name: string;
  firstName: string;
  country?: string;
  state?: string;
  timezone?: string;
}

function normEmail(email: string) {
  return email.toLowerCase().trim();
}

export function readAccounts(): Record<string, StoredAccount> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredAccount>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getAccount(email: string): StoredAccount | undefined {
  return readAccounts()[normEmail(email)];
}

export function hasAccount(email: string): boolean {
  return normEmail(email) in readAccounts();
}

export function registerAccount(email: string, account: StoredAccount): void {
  const key = normEmail(email);
  const next = { ...readAccounts(), [key]: account };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
}
