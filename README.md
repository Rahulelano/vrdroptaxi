# Coimbatore Drop Taxi

https://droptaxicoimbatore.com/
i want exact website

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91f740c0-7753-417f-affe-3be2d9ee2cd4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Backend & Admin Panel

The site now has a Node.js (Express) backend in `server/` with an admin panel at **`/admin`**.

### Run locally
```sh
cp .env.example .env      # fill SMTP + admin login
npm install
npm run server            # API on http://localhost:5000
npm run dev               # website on http://localhost:8080 (proxies /api to 5000)
```
First login: `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (default `admin@droptaxii.com` / `admin123` — change it in Settings).

### Production
```sh
npm run build && npm start   # Express serves the API and the built site (dist/) on PORT
```
Data is stored in **MongoDB Atlas** (`MONGODB_URI` in `.env`). Uploaded popup images/videos are saved in the `uploads/` folder — back that folder up. It needs a host that runs Node.js
(VPS, Render, Railway, Hostinger Node hosting…); plain Apache/static hosting can't run the backend.

### What admin can do
- **Dashboard** – today's bookings, pending, pickups today, monthly revenue, 14-day chart, top routes
- **Bookings** – search/filter, view, edit, confirm/start/complete/cancel, assign driver, set final fare,
  internal notes, call/WhatsApp customer, re-send email, add phone bookings, export CSV, delete
- **Customers** – auto-created from bookings, edit, block from online booking, booking history, delete
- **Vehicles & Pricing** – one-way/round-trip ₹/km, driver bata, package price, add/edit/delete/hide vehicles
- **Routes & Destinations** – add/edit/delete routes, distance, time, image, show on home page
- **Drivers** – add/edit/delete, availability, trip counts
- **Website Popups** – image (upload/URL), video (MP4 upload or YouTube) or offer with coupon code; button link, pages, how often, delay, start/end date
- **Settings** – phone/WhatsApp, minimum km, announcement banner, pause bookings, email OTP on/off,
  booking alert emails, test email, admin/staff users, change password, device alerts

### Alerts & emails
- New booking → on-screen popup + sound in open admin panels, **push notification** on every device
  where "Enable alerts on this device" was turned on (Settings), and email to the alert addresses.
- Customer → email verification code (OTP), booking received email, status/driver updates (Nodemailer).
