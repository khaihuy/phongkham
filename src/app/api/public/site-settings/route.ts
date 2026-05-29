import { prisma } from "@/db/prisma"
import { apiHandler, sendSuccess } from "@/lib/api-utils"

export const GET = apiHandler(async () => {
  let s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } })
  if (!s) {
    s = await prisma.siteSettings.create({ data: { id: "singleton" } })
  }
  // Kèm tên phòng khám để các trang công khai (login, header...) hiển thị đúng
  const clinic = await prisma.clinic.findFirst({
    select: { name: true, phone: true, email: true, address: true },
  })
  return sendSuccess({ ...s, clinicName: clinic?.name ?? null })
})
