import { get as edgeGet } from '@vercel/edge-config';
import fs from 'node:fs';
import path from 'node:path';
import type { Machine, MachinesResponse } from './types';

const DEV_STORE = path.join(process.cwd(), 'data', 'dev-store.json');

async function readFromEdge(): Promise<MachinesResponse | null> {
  try {
    const machines = (await edgeGet<Machine[]>('machines')) || null;
    const updatedAt = (await edgeGet<string>('updatedAt')) || new Date().toISOString();
    if (machines) return { machines, updatedAt };
    return null;
  } catch {
    return null;
  }
}

function ensureDevStore(): void {
  const dir = path.dirname(DEV_STORE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DEV_STORE)) {
    const now = new Date().toISOString();
    const seed: MachinesResponse = {
      updatedAt: now,
      machines: [
        { id: 'm1', name: 'Washer A', status: 'idle', timeLeftMinutes: 0, updatedAt: now },
        { id: 'm2', name: 'Washer B', status: 'running', timeLeftMinutes: 30, updatedAt: now }
      ]
    };
    fs.writeFileSync(DEV_STORE, JSON.stringify(seed, null, 2));
  }
}

function readFromDev(): MachinesResponse {
  ensureDevStore();
  const raw = fs.readFileSync(DEV_STORE, 'utf-8');
  return JSON.parse(raw);
}

export async function getMachines(): Promise<MachinesResponse> {
  // Prefer Edge Config when EDGE_CONFIG is configured
  if (process.env.EDGE_CONFIG) {
    const fromEdge = await readFromEdge();
    if (fromEdge) return fromEdge;
  }
  return readFromDev();
}
