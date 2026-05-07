import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { sendSuccess, sendError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return sendError(401, "UNAUTHORIZED", "Chưa đăng nhập")
    }

    return sendSuccess({ user: session.user })
  } catch (error) {
    console.error("Error getting current user:", error)
    return sendError(500, "SERVER_ERROR", "Lỗi máy chủ")
  }
}
