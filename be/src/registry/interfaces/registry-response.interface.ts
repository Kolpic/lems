/**
 * Response payload for a successful PM creation.
 */
export interface CreatePMResponse {
  readonly status: 'success';
  readonly message: string;
  readonly data: {
    readonly id: string;
    readonly is_active: boolean;
  };
}

/**
 * Shape of a PM record returned in the registry listing.
 */
export interface RegistryListItem {
  readonly id: string;
  readonly name: string;
  readonly wallet_address: string;
  readonly target_balance: string;
  readonly is_active: boolean;
  readonly project_id: string;
  readonly created_at: Date;
  readonly currency: {
    readonly id: string;
    readonly symbol: string;
  };
}
