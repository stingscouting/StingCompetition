/**
 * Formats a date into a YYYY-MM-DD string in a specific timezone.
 * Defaults to 'UTC' if no timezone is provided.
 */
export function getDateKey(date: Date = new Date(), timezone: string = "UTC"): string {
    try {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        // en-CA format is YYYY-MM-DD
        return formatter.format(date);
    } catch (e) {
        console.error(`Invalid timezone "${timezone}", falling back to UTC`);
        return date.toISOString().split("T")[0];
    }
}

/**
 * Returns an array of YYYY-MM-DD date keys for the 7 days of the week 
 * containing the reference date, starting from Monday.
 */
export function getCurrentWeekKeys(refDate: Date = new Date(), timezone: string = "UTC"): string[] {
    const keys: string[] = [];

    // Get the date in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        weekday: "narrow"
    });

    // Helper to get day of week (0-6, 0=Sunday) in specific timezone
    // We'll use a more robust way to find the Monday
    const d = new Date(refDate);

    // Shift d to show the local time in the target timezone
    // This is tricky without a library, but for YYYY-MM-DD keys, 
    // we can iterate and check the day of week.

    // Better approach: 
    // 1. Get current date key in timezone.
    // 2. iterate around it to find the Monday.

    const todayKey = getDateKey(d, timezone);
    const [y, m, day] = todayKey.split("-").map(Number);

    // Create a date object that represents midnight in that timezone
    // This is just a reference point.
    let current = new Date(Date.UTC(y, m - 1, day));

    // Find day of week in target timezone
    const dayName = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(d);
    const dayMap: Record<string, number> = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
    const dayOfWeek = dayMap[dayName];

    // Days to subtract to get to Monday (if Sun=0, then Mon=1. if Today is Sun, subtract 6. if Today is Mon, subtract 0)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    for (let i = -diffToMonday; i < 7 - diffToMonday; i++) {
        const iterDate = new Date(d);
        iterDate.setDate(d.getDate() + i);
        keys.push(getDateKey(iterDate, timezone));
    }

    return keys;
}
