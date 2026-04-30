# Family Album Website (Client + Server)

This project now uses a separate client-server model:

- Public users can only view albums on `/`
- Only admin can login on `/admin` and add new albums
- Album data is stored in `data/albums.json`

## Setup

1. Install dependencies:
   - `npm install`
2. Create a `.env` file from `.env.example` and set:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
3. Start server:
   - `npm start`

Server runs at `http://localhost:3000`.

## Routes

- Public page: `http://localhost:3000/`
- Admin page: `http://localhost:3000/admin`

## Best deployment (recommended): Render

This is the best fit for your secure client-server model.

### 1) Push to GitHub

Push this project to a GitHub repository.

### 2) Create Render Web Service

1. Login to [Render](https://render.com/) and click **New +** -> **Web Service**
2. Connect your GitHub repository
3. Render auto-detects settings from `render.yaml`

### 3) Set secrets (required)

In Render service settings -> **Environment**, set:

- `ADMIN_USERNAME` (your private admin username)
- `ADMIN_PASSWORD` (your private admin password)
- `SESSION_SECRET` (long random string)

### 4) Deploy

Deploy the service. Your app URL will look like:

- `https://your-service-name.onrender.com/` (public view-only page)
- `https://your-service-name.onrender.com/admin` (admin login page)

### Why this is preferred

- Supports your Express server and session auth directly
- Supports persistent storage via mounted disk (`/var/data`)
- No rewrite needed to serverless functions

## Netlify note

Netlify static hosting alone is not enough for this architecture because your app needs a persistent Node server and writable data storage.
