import { adminDb } from "../lib/firebase-admin";
import { activateCompetition } from "../lib/repository";

async function testActivation() {
    console.log("Testing activation logic...");

    // 1. Check current subscribed count
    const snap = await adminDb.collection("companies").where("subscribed", "==", true).get();
    console.log(`Current subscribed companies: ${snap.size}`);

    if (snap.size < 5) {
        console.log("Scaling up to 5 companies for test...");
        for (let i = snap.size + 1; i <= 5; i++) {
            await adminDb.collection("companies").add({
                name: `Scale Test Co ${i}`,
                subscribed: true,
                totalPoints: 0,
                totalValidMeetings: 0,
                streakCount: 0,
                shieldAvailable: false,
                shieldUsed: false,
                disqualified: false,
                rank: 0
            });
        }
    }

    // 2. Try to activate with >= 5 companies -> should pass
    try {
        await activateCompetition({
            startAt: "2026-02-12T00:00:00Z",
            endAt: "2026-02-19T00:00:00Z",
            timezone: "Europe/Stockholm",
            rulesVersion: "v1"
        });
        console.log("PASS: Activation succeeded with >= 5 companies.");
    } catch (err: any) {
        console.error("FAIL: Activation failed with >= 5 companies:", err.message);
        process.exit(1);
    }

    // 3. Mark one company as unsubscribed to bring count to 4
    const companyToDisable = (await adminDb.collection("companies").where("subscribed", "==", true).limit(1).get()).docs[0];
    await companyToDisable.ref.update({ subscribed: false });
    console.log(`Temporarily disabled subscribed flag for company: ${companyToDisable.id}`);

    // 4. Try to activate with 4 companies -> should fail
    try {
        await activateCompetition({
            startAt: "2026-02-12T00:00:00Z",
            endAt: "2026-02-19T00:00:00Z",
            timezone: "Europe/Stockholm",
            rulesVersion: "v1"
        });
        console.error("FAIL: Activation succeeded with 4 companies!");
        process.exit(1);
    } catch (err: any) {
        console.log("PASS: Activation failed as expected with 4 companies:", err.message);
    }

    // Restore the business state
    await companyToDisable.ref.update({ subscribed: true });
    console.log("Restored subscribed flag.");

    console.log("Activation logic verification complete.");
}

testActivation().catch(console.error);
