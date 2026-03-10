import type { PM, CreatePMPayload, CreatePMResponse } from '../types/registry';

const API_BASE_URL = 'http://localhost:3000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token') ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Fetches all registered PMs from the backend. */
export async function fetchRegistry(): Promise<PM[]> {
  const response = await fetch(`${API_BASE_URL}/registry`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.status}`);
  }

  return response.json() as Promise<PM[]>;
}

/** Creates a new PM registration. */
export async function createPM(payload: CreatePMPayload): Promise<CreatePMResponse> {
  const response = await fetch(`${API_BASE_URL}/registry`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create PM: ${response.status}`);
  }

  return response.json() as Promise<CreatePMResponse>;
}
