import { adminDb } from "../lib/firebase-admin";
import { createMeeting, duplicateMeetingExists, getCompany } from "../lib/repository";
import { DAILY_MEETING_CAP } from "../lib/constants";
import { toDateKey } from "../lib/time";

async function testMeetings() {
    console.log("Testing meeting submission flows...");

    const companyDoc = (await adminDb.collection("companies").limit(1).get()).docs[0];
    const companyId = companyDoc.id;
    const initialData = companyDoc.data() as any;
    console.log(`Using company: ${initialData.name} (${companyId})`);

    const meetingAt = new Date().toISOString();
    const timezone = "Europe/Stockholm";
    const createdAt = new Date().toISOString();
    // Use a unique future date key to ensure we start from 0 meetings for this test
    const submissionDateKey = "2026-12-31";

    // 1. Submit valid meeting
    console.log("Submitting 1st meeting...");
    await createMeeting({
        companyId,
        prospectCompanyName: "Test Prospect 1",
        contactName: "John Doe",
        meetingAt,
        durationMinutes: 30,
        type: "digital",
        createdAt,
        submissionDateKey
    });

    let company = await getCompany(companyId);
    console.log(`Company points: ${company?.totalPoints} (expected ${initialData.totalPoints + 10})`);
    if (company?.totalPoints !== (initialData.totalPoints + 10)) {
        console.error(`FAIL: Points not incremented correctly for 1st meeting. Got ${company?.totalPoints}`);
        process.exit(1);
    }

    // 2. Test duplicate rejection (frontend/API logic)
    const isDuplicate = await duplicateMeetingExists(companyId, "Test Prospect 1", meetingAt);
    if (isDuplicate) {
        console.log("PASS: Duplicate meeting detected correctly.");
    } else {
        console.error("FAIL: Duplicate meeting NOT detected!");
        process.exit(1);
    }

    // 3. Test daily cap
    console.log(`Filling up to daily cap (${DAILY_MEETING_CAP})...`);
    for (let i = 2; i <= DAILY_MEETING_CAP; i++) {
        await createMeeting({
            companyId,
            prospectCompanyName: `Test Prospect ${i}`,
            contactName: "Jane Doe",
            meetingAt,
            durationMinutes: 30,
            type: "digital",
            createdAt,
            submissionDateKey
        });
    }

    company = await getCompany(companyId);
    const expectedPointsAfterCap = initialData.totalPoints + 70;
    console.log(`Company points after ${DAILY_MEETING_CAP} meetings: ${company?.totalPoints} (expected ${expectedPointsAfterCap})`);
    if (company?.totalPoints !== expectedPointsAfterCap) {
        console.error(`FAIL: Points not correct after cap. Got ${company?.totalPoints}, expected ${expectedPointsAfterCap}`);
        process.exit(1);
    }

    // 4. Submit 7th meeting -> delta should be 0
    console.log("Submitting 7th meeting (over cap)...");
    await createMeeting({
        companyId,
        prospectCompanyName: "Test Prospect 7",
        contactName: "Ghost",
        meetingAt,
        durationMinutes: 30,
        type: "digital",
        createdAt,
        submissionDateKey
    });

    company = await getCompany(companyId);
    console.log(`Company points after 7 meetings: ${company?.totalPoints} (expected ${expectedPointsAfterCap})`);
    if (company?.totalPoints !== expectedPointsAfterCap) {
        console.error("FAIL: Points incremented even after cap!");
        process.exit(1);
    }
    console.log("PASS: Daily cap enforced (no points for 7th meeting).");

    console.log("Meeting flows verification complete.");
}

testMeetings().catch(console.error);
