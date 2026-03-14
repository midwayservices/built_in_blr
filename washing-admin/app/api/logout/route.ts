import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  const res = new NextResponse('OK', { status: 200 });
  const clear = clearSession();
  res.cookies.set({
    name: clear.name,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return res;
}
