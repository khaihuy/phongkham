import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { apiHandler, requireRole, sendSuccess, ApiError } from '@/lib/api-utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(['ADMIN'])

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    throw new ApiError('BAD_REQUEST', 400, 'Không tìm thấy file')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ApiError('BAD_REQUEST', 400, 'Chỉ cho phép file ảnh (JPG, PNG, WebP, GIF)')
  }

  if (file.size > MAX_SIZE) {
    throw new ApiError('BAD_REQUEST', 400, 'File quá lớn, tối đa 2MB')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const filename = `logo-${Date.now()}.${ext}`

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), buffer)

  return sendSuccess({ url: `/uploads/${filename}` })
})
