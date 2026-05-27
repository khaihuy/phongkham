import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, requireRole, sendSuccess } from "@/lib/api-utils"
import { z } from "zod"

const updateClinicSchema = z.object({
  name: z.string().min(1).optional(),
  taxCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  website: z.string().optional(),
  licenseNo: z.string().optional(),
  logoUrl: z.string().optional(),
  pharmacyName: z.string().optional(),
  pharmacyAddress: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  pharmacyLicenseNo: z.string().optional(),
  pharmacyManager: z.string().optional(),
  pharmacyTaxCode: z.string().optional(),
})

export const GET = apiHandler(async () => {
  await getAuthUser()
  const clinic = await prisma.clinic.findFirst({ include: { branches: true } })
  return sendSuccess(clinic)
})

export const PUT = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN"])
  const body = await request.json()
  const input = updateClinicSchema.parse(body)
  const clinic = await prisma.clinic.findFirst()
  if (!clinic) {
    const created = await prisma.clinic.create({
      data: {
        name: input.name ?? "Phòng Khám",
        phone: input.phone ?? "",
        address: input.address ?? "",
        ...input,
      },
    })
    return sendSuccess(created)
  }
  const updated = await prisma.clinic.update({
    where: { id: clinic.id },
    data: input,
  })
  return sendSuccess(updated)
})
