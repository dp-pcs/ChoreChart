import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day // First day is Sunday (0)
  const start = new Date(d.setDate(diff))
  // Normalize to midnight for stable Date equality comparisons
  start.setHours(0, 0, 0, 0)
  return start
}

export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date)
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
}

export function getWeekDates(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date)
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Prisma Decimal helpers (safe JSON conversion)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecimalLike = { toNumber: () => number }

function isDecimalLike(value: unknown): value is DecimalLike {
  return !!value && typeof value === 'object' && typeof (value as { toNumber?: unknown }).toNumber === 'function'
}

export function decimalToNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (isDecimalLike(value)) return value.toNumber()
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

export function convertDecimalsDeep(obj: unknown): unknown {
  if (obj == null) return obj
  if (Array.isArray(obj)) return obj.map(convertDecimalsDeep)
  if (isDecimalLike(obj)) return obj.toNumber()
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convertDecimalsDeep(v)
    }
    return out
  }
  return obj
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isThisWeek(date: Date): boolean {
  const { start, end } = getWeekDates()
  return date >= start && date <= end
}

export function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayNumber] || 'Unknown'
}

export function getDaysUntil(targetDate: Date): number {
  const today = new Date()
  const target = new Date(targetDate)
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

// String utilities
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function pluralize(word: string, count: number): string {
  if (count === 1) return word
  
  // Simple pluralization rules
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies'
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch')) {
    return word + 'es'
  }
  return word + 's'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Number utilities
export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return roundToTwo((value / total) * 100)
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

// Object utilities
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    result[key] = obj[key]
  })
  return result
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

// Sleep utility for development/testing
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generate random ID (simple version)
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Deep equality check
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return false
  if (typeof obj1 !== typeof obj2) return false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

  const a = obj1 as Record<string, unknown>
  const b = obj2 as Record<string, unknown>
  const keys1 = Object.keys(a)
  const keys2 = Object.keys(b)
  if (keys1.length !== keys2.length) return false
  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }
  return true
}