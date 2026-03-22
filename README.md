# Frederiks-Dorp Network Inventory

A full-stack web app for tracking and managing all network devices across the Frederiks-Dorp site — switches, routers, APs, point-to-point links, POS systems, and Starlink.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Prisma** + SQLite (swappable to Postgres)
- **NextAuth.js** — credential-based login
- **Tailwind CSS** + shadcn/ui
- **react-flow** — topology graph view
- **Docker + Nginx** — VPS deployment ready

## Features
- Device CRUD with type badges & status tracking
- Changelog / audit history per device
- Live ping-check per device
- Network topology graph
- CSV & PDF export
- Role-based access (admin / viewer)

## Getting Started

```bash
cp .env.example .env        # fill in NEXTAUTH_SECRET
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## VPS Deployment

```bash
docker-compose up -d
```
