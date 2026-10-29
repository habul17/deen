# Deen

A calm, private companion for the five daily prayers and Tahajjud.

- **Accurate times.** Calculated on the device for your location, with 12 methods, Shafiʿi/Hanafi Asr, high-latitude rules, and per-prayer offsets or fixed jamāʿah times.
- **One-tap logging.** Tap marks a prayer on time; hold opens the details: on time / late / made up / missed, alone / jamāʿah / masjid, and the sunnah before and after.
- **Qaḍāʾ counter.** Set a backlog (or estimate it from years) and make prayers up one at a time. Missed prayers are added automatically.
- **Stats.** Streaks, a year-long consistency heatmap, a breakdown for each prayer, and Tahajjud tracked separately.
- **Real life.** Excused days (ḥaiḍ / nifās) pause tracking without breaking streaks. Travel mode marks prayers as shortened or combined. Past days can be edited and given notes.
- **Reminders.** Web push when a prayer begins, an optional nudge if it is still unmarked, and a "Prayed" button that logs the prayer straight from the notification.
- **Offline-first PWA.** It installs to the home screen and works without a signal. Changes queue locally and sync when you are back online.
- **Private.** No social features. Each account sees only its own data and can export or delete it at any time.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Better Auth · Prisma 7 + PostgreSQL · adhan · Motion + GSAP · Zustand + IndexedDB · Web Push

## Local development

```bash
npm install
cp .env.example .env          # then fill in the values
npx prisma dev                # starts a local Postgres; copy its URL into DATABASE_URL
npx prisma migrate dev        # creates the tables
npm run dev
```

Open http://localhost:3000.

Google sign-in, email and push are all optional in development:

- Without the Google keys, the Google button is hidden.
- Without Resend, password-reset links are printed to the server console.
- Without VAPID keys, the reminder settings explain that push isn't configured.

## Deploying (Vercel + Neon)

1. **Database.** Create a Neon project and copy the pooled connection string into `DATABASE_URL`.
2. **Vercel.** Import the repository and add every variable from `.env.example`. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the production URL. The `vercel-build` script generates the Prisma client, applies migrations, and builds.
3. **Google OAuth.** In Google Cloud Console, create an OAuth client ID of type *Web application* and add `https://<your-domain>/api/auth/callback/google` as an authorised redirect URI.
4. **Email.** Verify a domain in [Resend](https://resend.com), then set `RESEND_API_KEY` and `EMAIL_FROM`.
5. **Push keys.** Run `npx web-push generate-vapid-keys` and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`.
6. **Reminder schedule.** Reminders are sent by `/api/cron/notify`, which has to be called every minute. Vercel Hobby cron runs only once a day, so use a free external scheduler such as [cron-job.org](https://cron-job.org) or Upstash QStash:

   ```
   GET https://<your-domain>/api/cron/notify
   Authorization: Bearer <CRON_SECRET>
   ```

   Each prayer is sent at most once per user, so retries and overlapping runs are safe.

### Notes on notifications

- On iPhone and iPad, web push works only after the site is added to the Home Screen (iOS 16.4+). The settings screen tells users this.
- Prayer times for reminders are calculated on the server from each user's saved location, method and adjustments, so they match what the app shows.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:studio` | Browse the database |

