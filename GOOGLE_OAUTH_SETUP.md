# Google OAuth Setup

The frontend Google button is already connected to Supabase Auth. Complete these dashboard steps once to enable the provider.

## 1. Create a Google OAuth client

1. Open the [Google Auth Platform console](https://console.cloud.google.com/auth/overview).
2. Select or create a Google Cloud project.
3. Configure **Branding** with the app name and support email.
4. Configure **Audience**. Use **External** while testing and add your Google account as a test user if Google requests it.
5. Open **Data Access** and confirm these scopes:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Open **Clients**, create a client, and choose **Web application**.
7. Add these **Authorized JavaScript origins**:

```text
http://localhost:5173
http://127.0.0.1:5173
```

8. Add the **Authorized redirect URI** displayed on your Supabase Google provider page. It has this shape:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

9. Create the client. Keep the generated Client ID and Client Secret private.

## 2. Enable Google in Supabase

1. Open your Supabase project.
2. Go to **Authentication > Providers > Google**.
3. Enable the Google provider.
4. Paste the Google OAuth Client ID and Client Secret.
5. Save the provider.

## 3. Allow local redirects in Supabase

1. Go to **Authentication > URL Configuration**.
2. Set **Site URL** to:

```text
http://localhost:5173
```

3. Add these **Redirect URLs**:

```text
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
http://localhost:5173/update-password
http://127.0.0.1:5173/update-password
```

Use the deployed production domain instead of localhost when the app is hosted.

## Security

Do not paste the Google Client Secret into `.env.local`, frontend code, or chat. Store it only in the Supabase Google provider settings.
