import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/api-utils"

const MAX_SIZE = 512 * 1024 // 512 KB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]

export const POST = async (request: NextRequest) => {
  try {
    await requireRole(["ADMIN"])
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Không có file" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Chỉ chấp nhận PNG, JPG, SVG, WebP" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File quá lớn, tối đa 512KB" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const dataUrl = `data:${file.type};base64,${base64}`

  return NextResponse.json({ data: { url: dataUrl } })
}
