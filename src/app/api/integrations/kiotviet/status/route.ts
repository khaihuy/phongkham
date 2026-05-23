import { apiHandler, getAuthUser, sendSuccess } from "@/lib/api-utils"
import { getKiotVietProvider, isKiotVietMock } from "@/lib/integrations/kiotviet/provider"

export const GET = apiHandler(async () => {
  await getAuthUser()
  const provider = getKiotVietProvider()
  const ping = await provider.ping()
  return sendSuccess({
    mode: isKiotVietMock() ? "mock" : "real",
    provider: provider.name,
    ...ping,
  })
})
