import { auth as authCore } from '@/lib/auth'

/**
 * Edge-safe auth function for middleware
 * Only checks JWT validity without password verification
 * Password verification happens in the Credentials provider (Node.js runtime)
 */
export const auth = authCore
