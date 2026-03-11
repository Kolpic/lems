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
