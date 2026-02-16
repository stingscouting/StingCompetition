import type { Company } from "@/lib/types";

export function rankCompanies(companies: Company[]): Company[] {
  const sorted = [...companies].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.totalValidMeetings !== a.totalValidMeetings) {
      return b.totalValidMeetings - a.totalValidMeetings;
    }
    return a.name.localeCompare(b.name);
  });

  return sorted.map((company, index) => ({ ...company, rank: index + 1 }));
}
