import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Online payment needs both server keys (server-side check only)
export const isPaymentEnabled = () =>
  !!(process.env.PAYMONGO_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY)

export const PAYMENT_UNAVAILABLE_MESSAGE = "Online payment is not available right now."

// An unpaid reservation holds its dates for this long while the guest pays.
// After that it no longer blocks anyone (e.g. the guest closed the GCash page).
export const PENDING_PAYMENT_MINUTES = 30

// Supabase .or() filter: reservations that still block dates (paid, or recently started)
export function activeReservationFilter() {
  const cutoff = new Date(Date.now() - PENDING_PAYMENT_MINUTES * 60 * 1000).toISOString()
  return `isPaid.eq.true,created_at.gt.${cutoff}`
}

// Public site URL (used for OAuth and payment redirects)
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// Public URL of a photo stored in the Supabase "images" bucket
export function getImageUrl(path?: string | null) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${path}`
}

// Number of nights between two dates
export function getNights(checkIn: Date, checkOut: Date) {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
}
