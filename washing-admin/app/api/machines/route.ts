import { NextResponse } from 'next/server';
import { getMachines, setMachines } from '@/lib/data';
import type { Machine } from '@/lib/types';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getMachines();
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  if (!isAuthed()) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  try {
    const body = (await req.json()) as { machines: Machine[] };
    if (!Array.isArray(body.machines)) {
      return new NextResponse('Invalid payload', { status: 400 });
    }
    const cleaned = body.machines.map((m) => ({
      ...m,
      updatedAt: new Date().toISOString()
    }));
    const saved = await setMachines(cleaned);
    return NextResponse.json(saved, { status: 200 });
  } catch {
    return new NextResponse('Error saving', { status: 500 });
  }
}

