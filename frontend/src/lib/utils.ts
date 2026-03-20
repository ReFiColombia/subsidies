import { type ClassValue,clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const secondsToDays = (seconds: number) =>
  Math.round(seconds / 60 / 60 / 24)
