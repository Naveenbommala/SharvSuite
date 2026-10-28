import { apiFetch } from '../apiClient';

export type CustomerOption = {
  id: string;
  name: string;
  code: string;
};

export async function fetchCustomerOptions(): Promise<CustomerOption[]> {
  const response = await apiFetch('/api/customers/customer-list');
  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }

  const json = (await response.json()) as Array<Record<string, unknown>>;
  return json
    .map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.primaryField ?? '').trim(),
      code: String(item.secondaryField ?? '').trim(),
    }))
    .filter((item) => item.id.length > 0 && item.name.length > 0);
}

export function findCustomerMatch(
  options: CustomerOption[],
  value: string,
): CustomerOption | null {
  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  return (
    options.find(
      (option) =>
        option.name.trim().toLowerCase() === normalizedValue ||
        option.code.trim().toLowerCase() === normalizedValue,
    ) ?? null
  );
}
