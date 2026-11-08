# Berry Fitness for Health website

Website and admin panel for Berry Fitness for Health, a personal training business in Nairobi, Kenya.

- **Frontend (this folder):** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** its own API in `../berry_api` (Express, Prisma, MariaDB), with its own database, `berry_fitness`.

See also [docs/API.md](docs/API.md) and [docs/MISSING-INFORMATION.md](docs/MISSING-INFORMATION.md).

## Run it locally

You need Node.js 20+ and a running MariaDB or MySQL server.

**1. Backend** (from `../berry_api`, with its `.env` configured from `.env.example`; see its README to create the database):

```bash
npm install
npm run prisma:deploy
BERRY_ADMIN_PASSWORD='choose-a-strong-password' npm run seed
npm run dev                # http://localhost:4001, Swagger docs at /docs
```

`npm run seed` creates the `berry` app and its content. It is safe to re-run and never overwrites edits made in the admin. If you leave out `BERRY_ADMIN_PASSWORD`, it prints a random password once.

**2. Frontend** (this folder):

```bash
npm install
cp .env.example .env.local # set NEXTAUTH_SECRET: openssl rand -base64 32
npm run dev                # http://localhost:3002
```

For production use `npm run build`, then `npm start`.

Admin panel: `/admin`. The default login email is `admin@berryfitnessforhealth.com` (override with `BERRY_ADMIN_EMAIL`).

## Environment variables

| Where | Variable | Purpose |
|---|---|---|
| Frontend | `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL` | Public URL of the site |
| Frontend | `NEXTAUTH_SECRET` | Session signing secret |
| Frontend | `BACKEND_URL` | Address of the API |
| Frontend | `NEXT_PUBLIC_APP_KEY` | Must be `berry` |
| Frontend | `NEXT_PUBLIC_CURRENCY` | `USD`; keep in line with the `currency` setting in the database |
| Frontend | `NEXT_PUBLIC_WHATSAPP` | Fallback only, used if the API is unreachable |
| API | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Berry's mailbox for sending email |
| API | `BERRY_FRONTEND_URL` | Site URL used in email links, read by the seed |
| API | `BERRY_DIR` | Path to this folder, if it isn't `../berry`. Used by the seed |

Keep secrets in `.env` files only.

## Where content lives

| Content | Stored in | Edit in the admin |
|---|---|---|
| Contact details, hero, About, stats, page headings | `App.settings` | Settings |
| Services and prices | `Training` | Services & packages |
| Store | `Product`, `Category` | Products, Categories |
| Events | `Event` | Events |
| Testimonials | `Testimonial` | Testimonials. One with an "achievement" becomes the featured story on Home |
| Gallery | `GalleryImage`, `uploads/berry/gallery` | Gallery |
| Home slideshow | `Banner` with placement `slider` | Content → Banners |
| FAQs | `Faq` | Content → FAQs |

Still in code: legal pages, form labels, button text, some section titles, the four Shop badges, and the booking steps on Events and Corporate. Service, event and product photos are files in `public/images`; the database stores their paths.

Original gallery photos for seeding are in `seed/gallery`.

## How booking and payment work

There is no online payment. A service booking, event registration or store order is saved first and given a reference. The customer then continues on WhatsApp, where price and payment are confirmed.

## Colours

Primary `#007AA9`, light blue `#31A8F0`, dark slate `#1F3541`, font Open Sans. Defined in `app/globals.css`.
