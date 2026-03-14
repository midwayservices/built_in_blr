import { NextResponse } from 'next/server';
import { createSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password: string };
    if (!verifyPassword(password)) {
      return new NextResponse('Invalid', { status: 401 });
    }
    const session = createSession();
    const res = new NextResponse('OK', { status: 200 });
    res.cookies.set({
      name: session.name,
      value: session.value,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });
    return res;
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }
}
