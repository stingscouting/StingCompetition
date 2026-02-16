# Sting Sales Sprint

Gamified 1-week sales competition platform built with Next.js + Firebase.

## Setup

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - Copy `.env.example` to `.env.local`
   - Also configure `functions/.env` for scheduler email delivery
3. Run app:
   - `npm run dev`
4. Run tests:
   - `npm run test`
5. Authenticate:
   - Open `/auth` and use Firebase Email Link sign-in

## Environment Variables

See `.env.example`.

## Rules Source

This implementation follows:
- `.agent/rules/dataintegrityrules.md`
- `.agent/rules/gamificationlogicrules.md`
- `.agent/rules/productscoperules.md`
- `.agent/rules/securityrules.md`

## Deploy

- Firestore rules and indexes:
  - `firebase deploy --only firestore:rules,firestore:indexes`
- Functions:
  - `cd functions && npm install && npm run build`
  - `firebase deploy --only functions`
