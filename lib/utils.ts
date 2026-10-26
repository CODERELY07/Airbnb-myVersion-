import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
