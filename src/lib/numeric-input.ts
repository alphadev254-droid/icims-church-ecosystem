import type { FormEvent } from 'react';

export function digitsOnly(value: string, maxLength?: number): string {
  const next = value.replace(/\D/g, '');
  return maxLength ? next.slice(0, maxLength) : next;
}

export function phoneInputValue(value: string): string {
  const next = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return next.startsWith('+') ? `+${next.slice(1, 16)}` : next.slice(0, 15);
}

export function decimalInputValue(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
}

export const phoneInputProps = {
  inputMode: 'tel' as const,
  pattern: '\\+?[0-9]*',
};

export const digitsInputProps = {
  inputMode: 'numeric' as const,
  pattern: '[0-9]*',
};

export const decimalInputProps = {
  inputMode: 'decimal' as const,
};

export function sanitizePhoneInput(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = phoneInputValue(event.currentTarget.value);
}

export function sanitizeDigitsInput(event: FormEvent<HTMLInputElement>, maxLength?: number) {
  event.currentTarget.value = digitsOnly(event.currentTarget.value, maxLength);
}

export function sanitizeDecimalInput(event: FormEvent<HTMLInputElement>) {
  event.currentTarget.value = decimalInputValue(event.currentTarget.value);
}
