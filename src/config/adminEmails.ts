export const ADMIN_EMAILS = [
  'test@mitiendavirtual.cl',
]

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
