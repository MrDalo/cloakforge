/**
 * API Validation Utilities
 *
 * Provides standardized validation helpers for API routes using Zod schemas.
 */

import { z } from 'zod'

/**
 * Validates request body using a Zod schema
 *
 * @param body - The request body to validate
 * @param schema - The Zod schema to validate against
 * @returns Object with either success data or error details
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string } {
  try {
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, errors: errorMessages }
    }
    throw error
  }
}
