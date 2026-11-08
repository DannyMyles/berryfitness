# Berry Fitness API reference

Every request under `/api` must send `X-App-Key: berry`; the site's `proxy.ts` adds it automatically.

Interactive Swagger docs, with request bodies, are at `http://localhost:4001/docs` when the API is running.

**Access levels:** *Public* needs no login. *User* needs a customer token. *Admin* needs an admin token for this app (`Authorization: Bearer <token>`).

**Rate limit:** 300 requests per 15 minutes per IP address.

**Errors** return a matching HTTP status and JSON such as `{ "error": "This event has already taken place." }`.

## Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/app` | Business details and site settings |
| GET | `/api/v1/trainings`, `/categories`, `/slug/:slug`, `/:id` | Services and packages |
| POST | `/api/v1/enquiries` | Service booking or quote request |
| POST | `/api/v1/contact` | Contact form |
| GET | `/api/v1/events`, `/:slug` | Events. Add `?upcoming=true` for upcoming only |
| POST | `/api/v1/events/:slug/register` | Register for an event. Returns 409 for past events |
| GET | `/api/products`, `/:slug` | Store products |
| GET | `/api/categories` | Store categories |
| POST | `/api/orders` | Place an order. Totals are calculated on the server |
| GET | `/api/v1/testimonials`, `/:id`, `/:id/photo` | Published testimonials |
| POST | `/api/v1/testimonials/submit` | Submit a testimonial for review |
| GET | `/api/v1/gallery/categories`, `/images`, `/images/:id/file` | Gallery |
| GET | `/api/v1/banners?placement=slider` | Live banners and slides |
| GET | `/api/v1/faqs` | FAQs |
| GET | `/api/v1/youtube/videos` | Channel videos. Needs a YouTube API key on the server |
| GET | `/api/v1/blogs`, `/featured`, `/categories`, `/slug/:slug` | Blog |
| POST | `/api/v1/newsletter/subscribe` | Newsletter signup |
| GET | `/api/v1/newsletter/unsubscribe` | Newsletter unsubscribe |
| POST | `/api/v1/auth/register`, `/login`, `/refresh`, `/forgot-password`, `/reset-password`, `/verify-email`, `/resend-verification` | Accounts |

## User

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/auth/me` | Current account |
| GET | `/api/orders/mine` | The customer's orders |
| GET | `/api/v1/events/registrations/mine` | The customer's event tickets |

## Admin

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/stats`, `/emails` | Dashboard and email log |
| GET, PUT | `/api/v1/app/admin`, `/api/v1/app` | Read and update settings |
| POST | `/api/v1/app/test-email` | Send a test email |
| GET, PATCH, DELETE | `/api/v1/enquiries`, `/:id` | Manage enquiries and bookings |
| POST, PUT, DELETE | `/api/v1/trainings` | Manage services |
| POST, PUT, DELETE | `/api/products`, `/api/categories` | Manage the store |
| GET, PATCH | `/api/orders`, `/export`, `/:id`, `/:id/status` | Manage orders, CSV export |
| POST, PUT, DELETE | `/api/v1/events` | Manage events |
| GET, PATCH, POST | `/api/v1/events/registrations/*`, `/:id/registrations` | Registrations and check-in |
| POST, PUT, PATCH, DELETE | `/api/v1/testimonials` | Manage testimonials |
| POST, PUT, DELETE | `/api/v1/gallery/*`, `/api/v1/banners`, `/api/v1/faqs`, `/api/v1/blogs` | Manage content |
| GET, DELETE, POST | `/api/v1/newsletter`, `/send` | Subscribers and campaigns |
| GET, POST, PUT, DELETE | `/api/v1/users` | Manage users |

## Database

MariaDB database `berry_fitness`. The schema is in `../berry_api/prisma/schema.prisma`. Tables Berry uses include `App`, `User`, `Training`, `ServicePackage`, `Enquiry`, `Event`, `EventRegistration`, `Product`, `ProductImage`, `Category`, `Order`, `OrderItem`, `Testimonial`, `GalleryCategory`, `GalleryImage`, `Banner`, `Faq`, `Blog`, `NewsletterSubscriber` and `EmailLog`.
