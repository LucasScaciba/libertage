import { z } from 'zod';

/**
 * Validates if a phone number follows E.164 international format
 * E.164 format: +[country code][subscriber number]
 * Example: +5511999999999
 * 
 * @param phoneNumber - Phone number string to validate
 * @returns true if valid E.164 format, false otherwise
 */
export function validateE164Format(phoneNumber: string): boolean {
  // E.164 regex: starts with +, followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Sanitizes a phone number by removing whitespace and formatting characters
 * Preserves the leading + sign for international format
 * 
 * @param phoneNumber - Phone number string to sanitize
 * @returns Sanitized phone number with only + and digits
 */
export function sanitizePhoneNumber(phoneNumber: string): string {
  // Remove all characters except digits and +
  let sanitized = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure only one + at the beginning
  if (sanitized.includes('+')) {
    const digits = sanitized.replace(/\+/g, '');
    sanitized = '+' + digits;
  }
  
  return sanitized;
}

/**
 * Zod schema for phone number validation
 * Validates E.164 format with custom error message
 */
export const phoneNumberSchema = z.string()
  .min(1, 'Número de telefone é obrigatório')
  .refine(
    (phone) => validateE164Format(phone),
    'Formato de telefone inválido. Use o formato internacional (+55...)'
  );

/**
 * Zod schema for OTP code validation
 * Validates 6-digit numeric code
 */
export const otpCodeSchema = z.string()
  .length(6, 'Código deve ter 6 dígitos')
  .regex(/^\d{6}$/, 'Código deve conter apenas números');

/**
 * Zod schema for send OTP request
 */
export const sendOTPRequestSchema = z.object({
  phoneNumber: phoneNumberSchema
});

/**
 * Zod schema for verify OTP request
 */
export const verifyOTPRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
  otpCode: otpCodeSchema
});

/**
 * Type definitions for request schemas
 */
export type SendOTPRequest = z.infer<typeof sendOTPRequestSchema>;
export type VerifyOTPRequest = z.infer<typeof verifyOTPRequestSchema>;
