import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to merge Tailwind classes safely.
 * It combines `clsx` (for conditional classes) with `tailwind-merge` 
 * (to resolve conflicting Tailwind utility classes).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}