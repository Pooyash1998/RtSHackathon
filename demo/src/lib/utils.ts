import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clampReaderScale = (value: string | null) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(10, parsed)) : 50;
};

export const formatGradeLevel = (value: string) => {
  const level = value.trim().replace(/^(grade\s*)+/i, "").trim();
  return level ? `Grade ${level}` : "Grade";
};
