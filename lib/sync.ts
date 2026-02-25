import { apiFetch } from './api';
import type { ApiResponse } from './auth';

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncMutation {
  entity: string;
  entity_id?: number;
  action: SyncAction;
  payload?: any;
  client_time: string;
}

export interface SyncPushRequest {
  mutations: SyncMutation[];
}

export interface SyncChange {
  [key: string]: any;
}

export interface SyncPullResponse {
  changes: SyncChange[];
  since: string;
}

export async function pushSync(data: SyncPushRequest): Promise<void> {
  await apiFetch('/api/v1/sync/push', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function pullSync(since: string): Promise<ApiResponse<SyncPullResponse>> {
  return apiFetch<ApiResponse<SyncPullResponse>>(`/api/v1/sync/pull?since=${encodeURIComponent(since)}`);
}
