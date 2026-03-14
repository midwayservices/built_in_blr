import { NextResponse } from 'next/server';
import { getMachines } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getMachines();
  return NextResponse.json(data, { status: 200 });
}
