// Public doctor list — cho phần đặt lịch khách
import { NextRequest } from "next/server"
import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const specialtyId = searchParams.get("specialtyId")

  const doctors = await prisma.doctor.findMany({
    where: {
      isActive: true,
      ...(specialtyId && { specialtyId }),
    },
    orderBy: { user: { fullName: "asc" } },
    select: {
      id: true,
      title: true,
      yearsOfExp: true,
      bio: true,
      consultFee: true,
      user: { select: { fullName: true, avatarUrl: true } },
      specialty: { select: { id: true, name: true, code: true } },
    },
  })

  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, description: true },
  })

  return sendSuccess({ doctors, specialties })
})
