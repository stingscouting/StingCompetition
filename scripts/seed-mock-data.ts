import fs from "fs";
import path from "path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Manually load .env with robust multi-line support
const envPath = path.resolve(process.cwd(), ".env");
let env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    // Simple but better parser for this specific .env
    const lines = content.split("\n");
    let currentKey = "";
    let currentValue = "";

    for (let line of lines) {
        if (line.includes("=") && !currentKey) {
            const [key, ...rest] = line.split("=");
            currentKey = key.trim();
            currentValue = rest.join("=").trim();
        } else if (currentKey) {
            currentValue += "\n" + line.trim();
        }

        if (currentKey && (line.includes("-----END") || !line.trim() || lines[lines.indexOf(line) + 1]?.includes("="))) {
            // Clean up and store
            if (currentValue.startsWith('"') && currentValue.endsWith('"')) currentValue = currentValue.slice(1, -1);
            process.env[currentKey] = currentValue.replace(/\\n/g, "\n");
            currentKey = "";
            currentValue = "";
        }
    }
}

const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
});

const adminDb = getFirestore(app);

const companies = [
    { id: "c1", name: "Sarah Jenkins", dept: "Enterprise Solutions", points: 242500, streak: 7, rank: 1, quota: 250000 },
    { id: "c2", name: "Marcus Vance", dept: "Global Accounts", points: 188200, streak: 4, rank: 2, quota: 250000 },
    { id: "c3", name: "Elena Rodriguez", dept: "Mid-Market", points: 156000, streak: 2, rank: 3, quota: 250000 },
    { id: "c4", name: "David Chen", dept: "SMB", points: 120000, streak: 1, rank: 4, quota: 200000 },
    { id: "c5", name: "Team CloudScale", dept: "Global Sales", points: 95000, streak: 7, rank: 5, quota: 150000 },
];

async function seed() {
    console.log("Seeding mock data...");

    // 1. Seed Companies
    for (const c of companies) {
        await adminDb.collection("companies").doc(c.id).set({
            id: c.id,
            name: c.name,
            totalPoints: c.points,
            streakCount: c.streak,
            rank: c.rank,
            shieldAvailable: true,
            shieldUsed: false,
            totalValidMeetings: Math.floor(c.points / 10),
            notificationEmail: `${c.id}@example.com`,
            subscribed: true,
            achievements: ["Closer King", "Fast Start", "Team Player"]
        });
        console.log(`Seeded company: ${c.name}`);
    }

    // 2. Seed competition config
    await adminDb.collection("competition").doc("current").set({
        id: "current",
        status: "ACTIVE",
        startAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        endAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        timezone: "Europe/Stockholm",
        minCompanies: 5
    });

    // 3. Seed some best practices
    const practices = [
        { title: "Closing Technique for SaaS", category: "Closing", companyId: "c1", status: "approved" },
        { title: "Prospecting in LinkedIn", category: "Prospecting", companyId: "c2", status: "approved" },
        { title: "Handling Price Objections", category: "Handling", companyId: "c3", status: "pending" }
    ];

    for (const p of practices) {
        await adminDb.collection("bestPractices").add({
            ...p,
            createdAt: new Date().toISOString()
        });
    }

    console.log("Seeding complete!");
}

seed().catch(console.error);
