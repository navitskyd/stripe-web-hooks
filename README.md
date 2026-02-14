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

## Deploying to Google Cloud App Engine

1. **Set up your Google Cloud project**
   - Install and initialize the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
   - Authenticate with your account: `gcloud auth login`
   - Set your project: `gcloud config set project YOUR_PROJECT_ID`

2. **Prepare environment variables**
   - Copy `.env.sample` to `.env` and fill in your secrets.
   - For production, set these as [App Engine environment variables](https://cloud.google.com/appengine/docs/flexible/nodejs/runtime#environment_variables) or use [Secret Manager](https://cloud.google.com/secret-manager).

3. **Deploy**
   - Run:
     ```bash
     gcloud app deploy
     ```
   - The service will be available at the URL provided by GCP after deployment.

4. **(Optional) Deploy with Docker/Cloud Run**
   - You can also deploy using the provided `Dockerfile` to [Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy) if you prefer a containerized approach.

## Notes

- The `/webhook` route uses `express.raw` so Stripe signature verification works correctly.
- Do not commit your real keys; keep them in `.env` which is ignored by default in this repo.
