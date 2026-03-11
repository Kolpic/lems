import type { PM, Currency, Project, CreatePMPayload, CreatePMResponse, UpdateTargetPayload } from '../types/registry';

const API_BASE_URL = 'http://localhost:3000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem('access_token') ?? '';
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

/** Fetches all available currencies for PM allocation. */
export async function fetchCurrencies(): Promise<Currency[]> {
  const response = await fetch(`${API_BASE_URL}/registry/currencies`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch currencies: ${response.status}`);
  }

  return response.json() as Promise<Currency[]>;
}

/** Fetches all available projects for PM assignment. */
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/registry/projects`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return response.json() as Promise<Project[]>;
}

/** Updates the target balance for an existing PM. */
export async function updateTargetBalance(payload: UpdateTargetPayload): Promise<CreatePMResponse> {
  const response = await fetch(`${API_BASE_URL}/registry/${payload.id}/target`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ target_balance: payload.target_balance }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update target balance: ${response.status}`);
  }

  return response.json() as Promise<CreatePMResponse>;
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
