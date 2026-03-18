# AI SDR Platform

AI-guided outbound prospecting platform for PubNub's SDR team. A comprehensive 6-step workflow: Target → Prospect → Research → Compose → Sequence → Track.

## Overview

This platform streamlines the entire outbound sales development process using AI-powered automation and intelligent workflows. Built specifically for PubNub's SDR team to enhance prospecting efficiency and effectiveness.

## Features

- **Intelligent Targeting**: AI-powered prospect identification and segmentation
- **Smart Prospecting**: Automated lead enrichment and qualification
- **AI Research**: Deep prospect and company research automation
- **Content Generation**: AI-powered email and message composition
- **Sequence Management**: Automated follow-up campaigns and cadences
- **Performance Tracking**: Comprehensive analytics and reporting

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **API Layer**: tRPC for type-safe API communication
- **Database**: Prisma ORM + Supabase PostgreSQL
- **AI**: Claude API for all AI workflows and content generation
- **State Management**: TanStack Query for data fetching
- **Background Jobs**: Inngest for asynchronous processing
- **Integrations**: Salesforce, ZoomInfo, and other sales tools

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and database
- Claude API key (Anthropic)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PubNubDevelopers/aisdr.git
cd aisdr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Fill in your API keys and database URLs
```

4. Set up the database:
```bash
npm run db:push
npm run db:generate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Create production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run db:generate` — Regenerate Prisma client
- `npm run db:push` — Push schema changes to database
- `npm run db:migrate` — Create and run database migrations
- `npm run db:studio` — Open Prisma Studio

## Project Structure

```
src/
├── app/(dashboard)/          # Main workflow pages
│   ├── targeting/           # Target identification
│   ├── prospecting/         # Lead prospecting
│   ├── research/            # AI research workflows
│   ├── compose/             # Content generation
│   ├── sequences/           # Campaign management
│   └── tracking/            # Analytics & reporting
├── server/routers/          # tRPC API routes
├── lib/
│   ├── ai/                  # Claude API client & prompts
│   ├── integrations/        # External API clients
│   └── utils/               # Shared utilities
└── components/              # React components
```

## Configuration

The application requires several environment variables. Copy `.env.example` to `.env` and configure:

- **Database**: Supabase connection strings
- **AI**: Claude API key and configuration
- **Integrations**: API keys for Salesforce, ZoomInfo, etc.
- **Background Jobs**: Inngest configuration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is proprietary software developed for PubNub Inc.

## Support

For questions or support, please contact the PubNub Developer Relations team at devrel@pubnub.com.
