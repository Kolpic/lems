import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreatePMPayload } from '../types/registry';

interface AddPMFormProps {
  readonly onSubmit: (payload: CreatePMPayload) => Promise<unknown>;
  readonly isSubmitting: boolean;
}

interface FormFields {
  name: string;
  wallet_address: string;
  target_balance: string;
  project_id: string;
  currency_id: string;
}

interface FormErrors {
  name?: string;
  wallet_address?: string;
  target_balance?: string;
  project_id?: string;
  currency_id?: string;
}

const INITIAL_FIELDS: FormFields = {
  name: '',
  wallet_address: '',
  target_balance: '',
  project_id: '',
  currency_id: '',
};

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (fields.wallet_address.length !== 44) {
    errors.wallet_address =
      'Invalid Solana address format. Must be a 44-character public key.';
  }

  const balance = Number(fields.target_balance);
  if (!fields.target_balance || isNaN(balance) || balance <= 0) {
    errors.target_balance = 'Target balance cannot be negative or zero.';
  }

  if (!fields.project_id.trim()) {
    errors.project_id = 'A Project ID must be assigned to this wallet.';
  }

  if (!fields.currency_id.trim()) {
    errors.currency_id = 'Currency ID is required.';
  }

  return errors;
}

export function AddPMForm({ onSubmit, isSubmitting }: AddPMFormProps) {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const errors = validate(fields);
  const hasErrors = Object.keys(errors).length > 0;

  function handleChange(field: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  function handleBlur(field: keyof FormFields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setTouched({
      name: true,
      wallet_address: true,
      target_balance: true,
      project_id: true,
      currency_id: true,
    });

    if (hasErrors) return;

    try {
      await onSubmit({
        name: fields.name.trim(),
        wallet_address: fields.wallet_address,
        target_balance: Number(fields.target_balance),
        project_id: fields.project_id.trim(),
        currency_id: fields.currency_id.trim(),
      });
      setFields(INITIAL_FIELDS);
      setTouched({});
      setSubmitSuccess(true);
      setSubmitError(null);
    } catch (err) {
      setSubmitSuccess(false);
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  }

  function renderField(
    field: keyof FormFields,
    label: string,
    type: string = 'text',
  ) {
    const error = touched[field] ? errors[field] : undefined;
    const inputId = `pm-${field}`;
    const errorId = `pm-${field}-error`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          id={inputId}
          type={type}
          value={fields[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`rounded border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {error && (
          <p id={errorId} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {renderField('name', 'Name')}
      {renderField('wallet_address', 'Wallet Address')}
      {renderField('target_balance', 'Target Balance', 'number')}
      {renderField('project_id', 'Project ID')}
      {renderField('currency_id', 'Currency ID')}

      <button
        type="submit"
        disabled={hasErrors || isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>

      {submitSuccess && (
        <p className="text-sm text-green-600" role="status">
          PM successfully registered.
        </p>
      )}
      {submitError && (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      )}
    </form>
  );
}
