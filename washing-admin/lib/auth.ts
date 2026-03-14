import { cookies } from 'next/headers';

const NAME = 'admin_session';

export function isAuthed() {
  const v = cookies().get(NAME)?.value;
  return Boolean(v && v === process.env.ADMIN_SESSION_VALUE);
}

export function verifyPassword(pw: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || 'admin';
  return pw === expected;
}

export function createSession() {
  const value = process.env.ADMIN_SESSION_VALUE || 'localdev';
  return {
    name: NAME,
    value,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    }
  };
}

export function clearSession() {
  return {
    name: NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    }
  };
}
