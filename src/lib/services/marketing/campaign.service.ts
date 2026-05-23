// Logic gửi chiến dịch broadcast tới toàn bộ bệnh nhân phù hợp với kênh.
//
// Nguyên tắc:
// - SMS/Zalo: cần `patient.phone`
// - EMAIL: cần `patient.email`
// - Mỗi lần gửi → tạo CampaignLog, không retry tự động
// - Khi xong: cập nhật Campaign.totalSent, totalFailed, status=COMPLETED, sentAt

import { prisma } from "@/db/prisma"
import { getProvider, renderTemplate } from "./provider"
import type { Campaign, NotificationChannel } from "@prisma/client"

export interface LaunchResult {
  campaignId: string
  totalAttempted: number
  totalSent: number
  totalFailed: number
  durationMs: number
}

export async function launchCampaign(campaignId: string): Promise<LaunchResult> {
  const start = Date.now()
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign) throw new Error("Không tìm thấy chiến dịch")

  const provider = getProvider(campaign.channel)
  const clinic = await prisma.clinic.findFirst()

  // Lấy danh sách bệnh nhân có thông tin liên hệ phù hợp với kênh
  const recipients = await pickRecipients(campaign.channel)

  let totalSent = 0
  let totalFailed = 0

  // Đánh dấu RUNNING trước khi gửi (đã có ở route hiện tại nhưng giữ idempotent)
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "RUNNING", sentAt: new Date() },
  })

  for (const r of recipients) {
    const personalized = renderTemplate(campaign.message, {
      name: r.name,
      clinic: clinic?.name ?? "Phòng khám",
    })

    const result = await provider.send(r.contact, personalized).catch((err) => ({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }))

    await prisma.campaignLog.create({
      data: {
        campaignId,
        patientId: r.patientId,
        channel: campaign.channel,
        recipient: r.contact,
        message: personalized,
        status: result.ok ? "SENT" : "FAILED",
        sentAt: result.ok ? new Date() : null,
        errorMsg: result.ok ? null : (result as any).error ?? "Unknown error",
      },
    })

    if (result.ok) totalSent++
    else totalFailed++
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "COMPLETED",
      totalSent,
      totalFailed,
    },
  })

  return {
    campaignId,
    totalAttempted: recipients.length,
    totalSent,
    totalFailed,
    durationMs: Date.now() - start,
  }
}

async function pickRecipients(channel: NotificationChannel) {
  // Hiện tại: gửi toàn bộ bệnh nhân chưa xóa, có contact hợp lệ.
  // Tương lai: targetGroup-based segmentation (theo độ tuổi, bệnh án, v.v.)
  const patients = await prisma.patient.findMany({
    where: { deletedAt: null },
    select: { id: true, fullName: true, phone: true, email: true },
  })

  return patients
    .map((p) => {
      const contact = channel === "EMAIL" ? p.email : p.phone
      if (!contact) return null
      return { patientId: p.id, name: p.fullName, contact }
    })
    .filter((x): x is { patientId: string; name: string; contact: string } => x !== null)
}
