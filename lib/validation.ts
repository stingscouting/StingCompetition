import { z } from "zod";
import { BEST_PRACTICE_MAX_CHARS, MIN_DURATION_MINUTES } from "@/lib/constants";

export const meetingInputSchema = z.object({
  prospectCompanyName: z.string().trim().min(1),
  contactName: z.string().trim().min(1),
  meetingAt: z.string().datetime(),
  durationMinutes: z.number().int().min(MIN_DURATION_MINUTES),
  type: z.enum(["digital", "in person"])
});

export const bestPracticeInputSchema = z.object({
  message: z.string().trim().min(1).max(BEST_PRACTICE_MAX_CHARS)
});

export const rulesUpdateSchema = z.object({
  content: z.string().trim().min(1)
});

export function normalizeProspect(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. if present
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
