"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyEmailDigest = exports.dailyRollover = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const resend_1 = require("resend");
admin.initializeApp();
const db = admin.firestore();
function calculateDailyScore(count) {
    const capped = Math.min(count, 6);
    const base = capped * 10;
    const bonus = capped >= 3 ? 10 : capped === 2 ? 5 : 0;
    return base + bonus;
}
function dateKeyInTimezone(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value ?? "0000";
    const month = parts.find((p) => p.type === "month")?.value ?? "00";
    const day = parts.find((p) => p.type === "day")?.value ?? "00";
    return `${year}-${month}-${day}`;
}
exports.dailyRollover = (0, scheduler_1.onSchedule)({
    schedule: "every 60 minutes",
    timeZone: "UTC"
}, async () => {
    firebase_functions_1.logger.info("Running daily rollover");
    const competitionDoc = await db.collection("competition").doc("current").get();
    if (!competitionDoc.exists)
        return;
    const competition = competitionDoc.data();
    if (competition.status !== "ACTIVE")
        return;
    const companiesSnap = await db.collection("companies").get();
    const meetingsSnap = await db.collection("meetings").where("status", "==", "valid").get();
    const meetings = meetingsSnap.docs.map((d) => d.data());
    const nowDate = new Date();
    const localParts = new Intl.DateTimeFormat("en-US", {
        timeZone: competition.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).formatToParts(nowDate);
    const hour = Number(localParts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(localParts.find((p) => p.type === "minute")?.value ?? "0");
    if (!(hour === 0 && minute < 5))
        return;
    const rolloverDate = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
    const dateKey = dateKeyInTimezone(rolloverDate, competition.timezone);
    const batch = db.batch();
    const ranking = [];
    companiesSnap.docs.forEach((companyDoc) => {
        const company = companyDoc.data();
        const companyMeetings = meetings.filter((m) => m.companyId === companyDoc.id);
        const perDay = new Map();
        companyMeetings.forEach((m) => perDay.set(m.dateKey, (perDay.get(m.dateKey) ?? 0) + 1));
        let totalPoints = 0;
        [...perDay.keys()].sort().forEach((key) => {
            totalPoints += calculateDailyScore(perDay.get(key) ?? 0);
        });
        const hadMeetingYesterday = (perDay.get(dateKey) ?? 0) > 0;
        let nextStreak = company.streakCount;
        let shieldUsed = company.shieldUsed;
        if (hadMeetingYesterday) {
            nextStreak += 1;
        }
        else if (company.shieldAvailable && !company.shieldUsed) {
            shieldUsed = true;
        }
        else {
            nextStreak = 0;
        }
        ranking.push({
            id: companyDoc.id,
            name: company.name,
            totalPoints,
            totalValidMeetings: companyMeetings.length,
            streakCount: nextStreak
        });
        batch.set(db.collection("dailySnapshots").doc(`${dateKey}_${companyDoc.id}`), {
            dateKey,
            companyId: companyDoc.id,
            totalPoints,
            streakCount: nextStreak,
            createdAt: new Date().toISOString()
        }, { merge: true });
        batch.update(companyDoc.ref, {
            totalPoints,
            totalValidMeetings: companyMeetings.length,
            streakCount: nextStreak,
            shieldUsed
        });
    });
    ranking
        .sort((a, b) => b.totalPoints - a.totalPoints ||
        b.totalValidMeetings - a.totalValidMeetings ||
        a.name.localeCompare(b.name))
        .forEach((row, idx) => {
        batch.update(db.collection("companies").doc(row.id), { rank: idx + 1 });
        batch.update(db.collection("dailySnapshots").doc(`${dateKey}_${row.id}`), { rank: idx + 1 });
    });
    await batch.commit();
});
exports.dailyEmailDigest = (0, scheduler_1.onSchedule)({
    schedule: "every 60 minutes",
    timeZone: "UTC"
}, async () => {
    firebase_functions_1.logger.info("Running daily digest");
    const competitionDoc = await db.collection("competition").doc("current").get();
    if (!competitionDoc.exists)
        return;
    const competition = competitionDoc.data();
    if (competition.status !== "ACTIVE")
        return;
    const nowDate = new Date();
    const localParts = new Intl.DateTimeFormat("en-US", {
        timeZone: competition.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).formatToParts(nowDate);
    const hour = Number(localParts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(localParts.find((p) => p.type === "minute")?.value ?? "0");
    if (!(hour === 8 && minute < 5))
        return;
    const companiesSnap = await db.collection("companies").where("subscribed", "==", true).get();
    const yesterday = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayKey = dateKeyInTimezone(yesterday, competition.timezone);
    for (const doc of companiesSnap.docs) {
        const c = doc.data();
        if (!c.notificationEmail)
            continue;
        const yesterdayCountSnap = await db
            .collection("meetings")
            .where("companyId", "==", doc.id)
            .where("dateKey", "==", yesterdayKey)
            .where("status", "==", "valid")
            .count()
            .get();
        const hadMeetingsYesterday = yesterdayCountSnap.data().count > 0;
        const lines = [];
        if (c.streakCount === 1)
            lines.push("Great start! Keep the momentum going.");
        if (c.streakCount === 2)
            lines.push("Second day streak! Don't break it now.");
        if (c.streakCount >= 3)
            lines.push(`You're building real consistency. Day ${c.streakCount}.`);
        if (!hadMeetingsYesterday)
            lines.push("Don't lose your streak today. Book at least 1 meeting.");
        if (c.rank === 3)
            lines.push("You're in 3rd place - push today to climb.");
        if (c.rank === 1)
            lines.push("You're leading the board. Defend your position.");
        if (c.shieldAvailable && !c.shieldUsed)
            lines.push("You still have your Streak Shield available.");
        if (c.shieldUsed)
            lines.push("Your shield has been used. Stay consistent.");
        const subject = c.rank === 1
            ? "You are leading the board"
            : c.rank === 2
                ? "Second place - push today"
                : "You are climbing the leaderboard";
        const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: "Sting Sales Sprint <noreply@updates.sting-sprint.com>",
            to: c.notificationEmail,
            subject,
            html: `<p>${c.name},</p>
      <p>Rank: #${c.rank} | Points: ${c.totalPoints} | Streak: ${c.streakCount}</p>
      <ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
      <p><a href="${process.env.APP_BASE_URL}">Open dashboard</a></p>`
        });
    }
});
//# sourceMappingURL=index.js.map