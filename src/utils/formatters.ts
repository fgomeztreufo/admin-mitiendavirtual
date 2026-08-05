export function formatCLP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL')
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es-CL')
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`

  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}
