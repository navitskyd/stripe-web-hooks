# Stripe Webhooks Sample

Simple Node app to receive Stripe webhooks.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.sample` to `.env` and fill your keys:

```bash
cp .env.sample .env
# then edit .env to set STRIPE_SECRET and STRIPE_WEBHOOK_SECRET
```

3. Start the server:

```bash
npm start
```

## Local testing

- Using the Stripe CLI (recommended):

```bash
stripe listen --forward-to localhost:3000/webhook
```

- Or send a test event with a sample payload and signature (not recommended manually).

## Notes

- The `/webhook` route uses `express.raw` so Stripe signature verification works correctly.
- Do not commit your real keys; keep them in `.env` which is ignored by default in this repo.
