# Smart Farming Project - DOX Root

## Purpose

Smart Farming - An AI-powered agricultural management system for monitoring, analyzing, and optimizing farming operations.

## Ownership

**Project Owner**: lexciese
**Created**: 2025-06-14

## Local Contracts

### Core Contract

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

### Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

### Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

### Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

### Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions
- Verification must reflect an existing check

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

### Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

### Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## Work Guidance

### Technology Stack

- **Web dashboard**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Lives in `dashboard/`.
- **ESP32 firmware**: Arduino framework via PlatformIO, single `esp32dev` environment. WiFi soft-AP mode (ESP32 broadcasts its own hotspot at `192.168.4.1`); laptop running the dashboard joins and the firmware POSTs/polls it. Lives in `firmware/`.
- **Device comms**: REST polling. Next.js route handlers act as a state broker between browser and ESP32.

### Code Style

- TypeScript strict mode; no `any` without justification.
- Tailwind utility-first styling; theme tokens defined in `dashboard/src/app/globals.css`.
- No comments unless the *why* is non-obvious. Do not describe what the code does.
- API contracts (request/response shapes) live in `dashboard/src/lib/types.ts` and are the source of truth for both browser and ESP32.

### Development Workflow

- Web work happens inside `dashboard/`; run `npm run dev` from there.
- All changes require DOX pass before completion.
- Read DOX chain before editing; update DOX after meaningful changes.

## Verification

- `cd dashboard && npm run build` — must compile with no TypeScript or ESLint errors.
- `cd dashboard && npm run dev` — dashboard renders at `http://localhost:3000`; mock device ticker pushes readings every 2s.
- REST contract smoke test (see `dashboard/AGENTS.md`).

## Child DOX Index

- [`dashboard/AGENTS.md`](dashboard/AGENTS.md) — Next.js web dashboard: live sensor display, SIRAM control button, REST state broker for ESP32 comms. Also carries the Next.js 16 in-tree rules from `create-next-app`.
- [`firmware/AGENTS.md`](firmware/AGENTS.md) — ESP32 Arduino firmware: WiFi soft-AP, mock sensor reads with extension points, SIRAM relay + LED control, REST client to the dashboard.

---

*Last updated: 2026-06-14*
