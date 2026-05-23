// Thao tác trên 1 chỉ định dịch vụ cụ thể:
// - PATCH: cập nhật status, notes, quantity, hoặc đổi sequence (reorder)
// - DELETE: xóa

import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, sendSuccess, error } from "@/lib/api-utils"

const updateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]).optional(),
  notes: z.string().optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  sequence: z.number().int().min(1).optional(),
})

export const PATCH = apiHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string; serviceItemId: string } }
  ) => {
    const user = await getAuthUser()

    const existing = await prisma.medicalRecordService.findFirst({
      where: { id: params.serviceItemId, medicalRecordId: params.id },
    })
    if (!existing) throw error("NOT_FOUND", 404, "Chỉ định dịch vụ không tồn tại")

    const body = await request.json()
    const input = updateSchema.parse(body)

    // Nếu đổi sequence: swap với item đang giữ sequence đó (nếu có) để giữ
    // ràng buộc unique [medicalRecordId, sequence]
    if (input.sequence !== undefined && input.sequence !== existing.sequence) {
      const conflict = await prisma.medicalRecordService.findFirst({
        where: { medicalRecordId: params.id, sequence: input.sequence },
      })

      await prisma.$transaction(async (tx) => {
        if (conflict) {
          // Đặt tạm sequence = 0 để né unique constraint khi swap
          await tx.medicalRecordService.update({
            where: { id: existing.id },
            data: { sequence: -1 },
          })
          await tx.medicalRecordService.update({
            where: { id: conflict.id },
            data: { sequence: existing.sequence },
          })
        }
        await tx.medicalRecordService.update({
          where: { id: existing.id },
          data: { sequence: input.sequence },
        })
      })
    }

    // Tự đánh dấu performedAt + performedBy khi chuyển sang COMPLETED
    const setPerformed =
      input.status === "COMPLETED" && existing.status !== "COMPLETED"
        ? { performedAt: new Date(), performedById: user.id }
        : {}

    const updated = await prisma.medicalRecordService.update({
      where: { id: existing.id },
      data: {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.quantity !== undefined && { quantity: input.quantity }),
        ...setPerformed,
      },
      include: {
        service: { select: { id: true, name: true, code: true, price: true, unit: true } },
        performer: { select: { id: true, fullName: true } },
      },
    })

    return sendSuccess(updated)
  }
)

export const DELETE = apiHandler(
  async (
    _request: NextRequest,
    { params }: { params: { id: string; serviceItemId: string } }
  ) => {
    await getAuthUser()

    const existing = await prisma.medicalRecordService.findFirst({
      where: { id: params.serviceItemId, medicalRecordId: params.id },
    })
    if (!existing) throw error("NOT_FOUND", 404, "Chỉ định dịch vụ không tồn tại")

    await prisma.medicalRecordService.delete({ where: { id: existing.id } })
    return sendSuccess({ deleted: true })
  }
)
