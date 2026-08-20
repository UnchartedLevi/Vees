# X Provider Setup

Vees keeps social provider tokens and API keys out of browser code. Use this
checklist when wiring the placeholder X connector to a server-side data source.

## Xquik Source Option

Xquik can provide X search, account monitoring, webhooks, and REST API access
from a backend or Supabase Edge Function. Keep the API key in Supabase secrets,
then sync normalized posts and analytics into the existing Vees tables.

1. Create an Xquik API key from the Xquik dashboard.
2. Store it as a Supabase secret named `XQUIK_API_KEY`.
3. Create an Edge Function that calls Xquik REST API endpoints server-side.
4. Map the response into `social_accounts`, `posts`, and
   `analytics_snapshots`.
5. Return only normalized Vees records to the React app.

Recommended sync behavior:

- Use `from_today` for new accounts until historical import is implemented.
- Store the connected handle in `social_accounts.account_handle`.
- Keep raw provider responses out of the frontend state.
- Run scheduled sync jobs from Supabase or another backend worker.

## Local Validation

After adding the Edge Function, run:

```bash
npm run build
```

Use the X provider card only after the server-side function returns normalized
records that match the existing TypeScript types.
