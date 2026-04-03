# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 for analysis/programs, gpt-image-1 for image generation)

## Artifacts

### Archi Hub (`artifacts/archi-hub`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Description**: Full-stack architectural project management platform
- **Features**:
  - Create and manage architectural projects (residential, commercial, cultural, industrial, mixed-use, landscape)
  - Interactive Leaflet map for site location selection
  - AI-powered site analysis using GPT-5.2
  - Multi-step needs questionnaire
  - Architectural program generation with spaces, materials, sustainability strategies
  - AI image generation for exterior, interior, and landscape views
  - Project dashboard with status tracking and workflow steps
- **Design**: Dark architecture style — deep charcoal/slate backgrounds, amber/gold accents, Space Mono + Syne typography

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Preview path**: `/api`
- **Routes**: `/api/projects`, `/api/projects/:id`, `/api/projects/:id/site`, `/api/projects/:id/analyze`, `/api/projects/:id/questionnaire`, `/api/projects/:id/program`, `/api/projects/:id/images`, `/api/projects/dashboard/summary`, `/api/projects/recent`

## Database Schema

- **`projects`** — Core project table with location, status, and JSONB fields for analysis/questionnaire/program
- **`project_images`** — AI-generated images linked to projects

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
