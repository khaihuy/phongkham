import { NextRequest, NextResponse } from "next/server"
import { ZodError, ZodSchema } from "zod"
import { auth } from "./auth"

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: Array<{ field: string; message: string }>
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Success response wrapper
 */
export function success<T>(
  data: T,
  meta?: ApiResponse<T>["meta"],
  statusCode = 200
): [T, ApiResponse<T>, number] {
  return [
    data,
    {
      data,
      ...(meta && { meta }),
    },
    statusCode,
  ]
}

/**
 * Error response wrapper — order: code, statusCode, message
 */
export function error(
  code: string,
  statusCode: number,
  message: string,
  details?: Array<{ field: string; message: string }>
): ApiError {
  return new ApiError(code, statusCode, message, details)
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  data: T,
  statusCode = 200,
  meta?: ApiResponse<T>["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      ...(meta && { meta }),
    },
    { status: statusCode }
  )
}

/**
 * Send error response
 */
export function sendError(
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details && { details }),
    },
    { status: statusCode }
  )
}

/**
 * Validate request body
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
      throw new ApiError("VALIDATION_ERROR", 400, "Validation failed", details)
    }
    throw new ApiError("BAD_REQUEST", 400, "Invalid request body")
  }
}

/**
 * Get authenticated user
 */
export async function getAuthUser() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError("UNAUTHORIZED", 401, "Unauthorized")
  }
  return session.user as any
}

/**
 * Check authorization by role
 */
export async function requireRole(roles: string[]) {
  const user = await getAuthUser()
  if (!roles.includes(user.role)) {
    throw new ApiError("FORBIDDEN", 403, "Insufficient permissions")
  }
  return user
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: string | number
  pageSize?: string | number
  limit?: string | number
}

export function getPaginationParams(
  params: PaginationParams,
  defaultPageSize = 10
) {
  const pageSize = Math.min(
    parseInt(String(params.pageSize || params.limit || defaultPageSize)),
    100
  )
  const page = Math.max(parseInt(String(params.page || 1)), 1)
  const skip = (page - 1) * pageSize

  return { page, pageSize, skip }
}

/**
 * Create pagination meta
 */
export function createMeta(
  page: number,
  pageSize: number,
  total: number
): ApiResponse["meta"] {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Wrap API route handler with error handling
 */
export function apiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context)
    } catch (err) {
      if (err instanceof ApiError) {
        return sendError(err.statusCode, err.code, err.message, err.details)
      }

      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }))
        return sendError(400, "VALIDATION_ERROR", "Validation failed", details)
      }

      console.error("API Error:", err)
      return sendError(500, "SERVER_ERROR", "Internal server error")
    }
  }
}
