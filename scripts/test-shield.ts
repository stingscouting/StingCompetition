import { adminDb } from "../lib/firebase-admin";
import { updateBestPracticeStatus, getCompany } from "../lib/repository";

async function testShield() {
    console.log("Testing shield unlocking...");

    const companyDoc = (await adminDb.collection("companies").limit(1).get()).docs[0];
    const companyId = companyDoc.id;
    console.log(`Using company: ${companyDoc.data().name} (${companyId})`);

    // 1. Create a best practice submission
    const bpRef = adminDb.collection("bestPractices").doc();
    await bpRef.set({
        companyId,
        message: "This is a great sales tip.",
        status: "pending",
        createdAt: new Date().toISOString()
    });
    console.log(`Created best practice: ${bpRef.id}`);

    // 2. Approve it as admin
    await updateBestPracticeStatus({
        id: bpRef.id,
        status: "approved",
        reviewedBy: "admin@sting.co"
    });
    console.log("Approved best practice.");

    // 3. Check if shield is available
    const company = await getCompany(companyId);
    if (company?.shieldAvailable) {
        console.log("PASS: Shield unlocked successfully.");
    } else {
        console.error("FAIL: Shield NOT unlocked!");
        process.exit(1);
    }

    console.log("Shield verification complete.");
}

testShield().catch(console.error);
