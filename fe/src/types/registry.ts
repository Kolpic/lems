/** Shape of a PM record returned by GET /api/v1/registry. */
export interface PM {
  readonly id: string;
  readonly name: string;
  readonly wallet_address: string;
  readonly target_balance: string;
  readonly is_active: boolean;
  readonly project_id: string;
  readonly created_at: string;
  readonly currency: {
    readonly id: string;
    readonly symbol: string;
  };
  readonly project: {
    readonly id: string;
    readonly name: string;
  };
}

/** Shape of a project record returned by GET /api/v1/registry/projects. */
export interface Project {
  readonly id: string;
  readonly name: string;
  readonly start_date: string;
  readonly end_date: string;
}

/** Shape of a currency record returned by GET /api/v1/registry/currencies. */
export interface Currency {
  readonly id: string;
  readonly symbol: string;
  readonly decimals: number;
}

/** Payload sent to POST /api/v1/registry. */
export interface CreatePMPayload {
  readonly name: string;
  readonly wallet_address: string;
  readonly target_balance: number;
  readonly project_id: string;
  readonly currency_id: string;
}

/** Response from POST /api/v1/registry on success. */
export interface CreatePMResponse {
  readonly status: 'success';
  readonly message: string;
  readonly data: {
    readonly id: string;
    readonly is_active: boolean;
  };
}
