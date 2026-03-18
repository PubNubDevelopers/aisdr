# AI SDR Platform

## Overview
AI-guided outbound prospecting platform for PubNub's SDR team. 6-step workflow: Target → Prospect → Research → Compose → Sequence → Track.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- tRPC for type-safe API layer
- Prisma ORM + Supabase PostgreSQL
- Claude API for all AI workflows
- TanStack Query for data fetching
- Inngest for background jobs

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:generate` — regenerate Prisma client
- `npm run db:push` — push schema to DB (dev)
- `npm run db:migrate` — create migration (dev)

## Architecture
- `/src/app/(dashboard)/` — main workflow pages (targeting, prospecting, research, compose, sequences, tracking)
- `/src/server/routers/` — tRPC routers (one per workflow step)
- `/src/lib/ai/` — Claude API client, prompts, and AI workflows
- `/src/lib/integrations/` — external API clients (Salesforce, ZoomInfo, etc.)
- `/src/components/` — React components organized by workflow step

## Conventions
- All AI prompts live in `/src/lib/ai/prompts/` with versioning
- Integration clients use adapter pattern for unified interfaces
- tRPC procedures handle auth via Supabase session context
- Background jobs (enrichment, sync) go through Inngest
