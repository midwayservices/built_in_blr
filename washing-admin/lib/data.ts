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
  } catch (error) {
    console.error('Error reading from Edge Config:', error);
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

function writeToDev(data: MachinesResponse): MachinesResponse {
  ensureDevStore();
  fs.writeFileSync(DEV_STORE, JSON.stringify(data, null, 2));
  return data;
}

function extractEdgeConfigId(conn: string): string {
  // Handle multiple formats:
  // 1. Direct ecfg_ ID: "ecfg_xxxxxxxxxxxxxxx"
  // 2. Full URL: "https://edge-config.vercel.com/ecfg_xxxxx?token=xxx"
  // 3. Connection string with encoded ID
  
  if (conn.includes('edge-config.vercel.com')) {
    // Extract from full URL format
    const url = new URL(conn);
    const pathId = url.pathname.slice(1); // remove leading '/'
    // pathId might be "ecfg_xxx" or just the ID part
    return pathId.includes('ecfg_') ? pathId : `ecfg_${pathId}`;
  }
  
  // If it's just the ID, ensure it starts with ecfg_
  if (!conn.startsWith('ecfg_')) {
    console.warn(`Edge Config ID doesn't start with 'ecfg_': ${conn}`);
    console.warn(`Please use the full Edge Config ID from Vercel dashboard starting with 'ecfg_'`);
    return conn; // Return as-is and let API return detailed error
  }
  
  return conn;
}

export async function getMachines(): Promise<MachinesResponse> {
  if (process.env.EDGE_CONFIG) {
    const fromEdge = await readFromEdge();
    if (fromEdge) return fromEdge;
  }
  return readFromDev();
}

export async function setMachines(next: Machine[]): Promise<MachinesResponse> {
  const payload: MachinesResponse = {
    updatedAt: new Date().toISOString(),
    machines: next
  };
  
  if (process.env.EDGE_CONFIG && process.env.VERCEL_API_TOKEN) {
    try {
      const base = 'https://api.vercel.com/v1/edge-config';
      const id = extractEdgeConfigId(process.env.EDGE_CONFIG);
      const token = process.env.VERCEL_API_TOKEN;
      
      console.log('Writing to Edge Config:', { id, hasToken: !!token });
      
      const response = await fetch(`${base}/${id}/items`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            { operation: 'upsert', key: 'machines', value: next },
            { operation: 'upsert', key: 'updatedAt', value: payload.updatedAt }
          ]
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Edge Config API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        throw new Error(`Edge Config API error: ${response.status} - ${errorBody}`);
      }
      
      console.log('Successfully updated Edge Config');
      return payload;
    } catch (error) {
      console.error('Error writing to Edge Config:', error);
    }
  }
  
  return writeToDev(payload);
}
