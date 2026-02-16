import { adminDb } from "../lib/firebase-admin";

async function seed() {
    console.log("Starting seed...");

    // 1. Seed Rules
    await adminDb.collection("rulesContent").doc("current").set({
        content: "# Sting Sales Sprint Rules\n1. Log your meetings.\n2. Be honest.",
        updatedAt: new Date().toISOString(),
        updatedBy: "system-seed"
    });
    console.log("Seeded rulesContent/current");

    // 2. Seed Companies
    const companyNames = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    const companyIds: string[] = [];

    for (const name of companyNames) {
        const ref = adminDb.collection("companies").doc();
        await ref.set({
            name: `Company ${name}`,
            totalPoints: 0,
            totalValidMeetings: 0,
            streakCount: 0,
            shieldAvailable: false,
            shieldUsed: false,
            subscribed: true,
            notificationEmail: `admin@${name.toLowerCase()}.com`,
            disqualified: false,
            rank: 0
        });
        companyIds.push(ref.id);
        console.log(`Seeded company: ${name} (${ref.id})`);
    }

    // 3. Seed Users
    const users = [
        { email: "evelyn.felizzola@sting.co", role: "admin", name: "Evelyn Admin", companyId: companyIds[0] },
        { email: "participant1@alpha.com", role: "participant", name: "Participant Alpha", companyId: companyIds[0] },
        { email: "participant2@beta.com", role: "participant", name: "Participant Beta", companyId: companyIds[1] },
    ];

    for (const u of users) {
        // Some systems use email as ID, others use UID. Types say UserProfile has id: string.
        // Based on previous conversations, we migrate to UID-based, but for seeding we might use email as ID if that's what's expected.
        // Let's check how many users are in the system or if there's a specific pattern.
        await adminDb.collection("users").doc(u.email).set({
            id: u.email,
            email: u.email,
            role: u.role,
            name: u.name,
            companyId: u.companyId
        });
        console.log(`Seeded user: ${u.email}`);
    }

    console.log("Seed completed successfully!");
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
