import { supabase } from '../auth/supabase'

const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabase) throw new ApiError('Supabase is not configured. Complete the setup in the README.', 503)
  let { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new ApiError('Your session has expired. Please sign in again.', 401)

  const perform = (token: string) => fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  let response = await perform(data.session.access_token)
  if (response.status === 401) {
    const refreshed = await supabase.auth.refreshSession()
    if (refreshed.error || !refreshed.data.session) {
      await supabase.auth.signOut()
      throw new ApiError('Your session has expired. Please sign in again.', 401)
    }
    response = await perform(refreshed.data.session.access_token)
  }
  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const body = await response.json()
      const detail = body.detail
      message = typeof detail === 'string' ? detail : Array.isArray(detail)
        ? detail.map((item: { msg?: string; loc?: (string | number)[] }) => `${item.loc?.slice(-1)[0] ?? 'Field'}: ${item.msg ?? 'Invalid value'}`).join(' ')
        : message
    } catch { /* Use the status fallback for non-JSON errors. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
