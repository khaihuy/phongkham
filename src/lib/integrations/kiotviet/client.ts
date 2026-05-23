// HTTP client cho KiotViet Public API (https://developer.kiotviet.vn)
//
// Auth: OAuth 2.0 client_credentials. Lấy access_token từ
// https://id.kiotviet.vn/connect/token, gửi kèm header
// `Authorization: Bearer <token>` và `Retailer: <retailer_name>`.
//
// Token cache trong memory với TTL ~ expires_in - 60s.
// Khi gặp 401: clear cache + retry 1 lần.

export interface KiotVietConfig {
  retailer: string
  clientId: string
  clientSecret: string
  baseUrl?: string
  tokenUrl?: string
}

interface CachedToken {
  accessToken: string
  expiresAt: number
}

let tokenCache: CachedToken | null = null

async function getAccessToken(config: KiotVietConfig): Promise<string> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken
  }

  const tokenUrl = config.tokenUrl ?? "https://id.kiotviet.vn/connect/token"
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "PublicApi.Access",
  })

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  if (!res.ok) {
    throw new Error(`KiotViet OAuth failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }
  return data.access_token
}

export async function kiotvietFetch<T = any>(
  path: string,
  config: KiotVietConfig,
  init: RequestInit = {}
): Promise<T> {
  const baseUrl = config.baseUrl ?? "https://public.kiotapi.com"
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`

  const doFetch = async (): Promise<Response> => {
    const token = await getAccessToken(config)
    return fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Retailer: config.retailer,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    })
  }

  let res = await doFetch()
  if (res.status === 401) {
    tokenCache = null
    res = await doFetch()
  }
  if (!res.ok) {
    throw new Error(`KiotViet API ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}
