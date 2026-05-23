import { prisma } from "@/db/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json(
      {
        status: "error",
        db: "disconnected",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}
