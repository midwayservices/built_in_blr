export type Status = 'running' | 'idle' | 'paused' | 'finished';

export type Machine = {
  id: string;
  name: string;
  status: Status;
  timeLeftMinutes: number;
  updatedAt: string;
};

export type MachinesResponse = {
  machines: Machine[];
  updatedAt: string;
};

