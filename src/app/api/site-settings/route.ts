import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import { apiHandler, getAuthUser, requireRole, sendSuccess } from "@/lib/api-utils"

const updateSchema = z.object({
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroCtaText: z.string().optional(),
  heroCtaUrl: z.string().optional(),
  hotline: z.string().optional(),
  promoBannerText: z.string().nullable().optional(),
  promoBannerUrl: z.string().nullable().optional(),
  facebookUrl: z.string().nullable().optional().or(z.literal("")),
  youtubeUrl: z.string().nullable().optional().or(z.literal("")),
  zaloUrl: z.string().nullable().optional().or(z.literal("")),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
})

async function getSingleton() {
  let s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } })
  if (!s) {
    s = await prisma.siteSettings.create({ data: { id: "singleton" } })
  }
  return s
}

export const GET = apiHandler(async () => {
  await getAuthUser()
  return sendSuccess(await getSingleton())
})

export const PUT = apiHandler(async (request: NextRequest) => {
  await requireRole(["ADMIN"])
  await getSingleton() // ensure exists
  const body = await request.json()
  const input = updateSchema.parse(body)
  const updated = await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: input,
  })
  return sendSuccess(updated)
})
