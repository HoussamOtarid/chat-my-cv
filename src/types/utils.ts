// ============================================
// Utility Types
// ============================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Extract the promise type
 */
export type PromiseType<T extends Promise<unknown>> = T extends Promise<infer U>
  ? U
  : never

/**
 * Make all properties nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

/**
 * Exclude null and undefined from T
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Create a type with a subset of properties
 */
export type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends Array<infer U>
    ? Array<Subset<U>>
    : K[attr]
}

/**
 * Type guard for checking if a value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * Type guard for checking if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type guard for checking if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Type guard for checking if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}