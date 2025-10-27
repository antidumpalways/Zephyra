# Zephyra - AI-Powered MEV Protection Platform

## Overview

Zephyra is a DeFi security platform that protects Solana transactions from MEV (Maximal Extractable Value) attacks using AI-powered route analysis and real-time simulation. Built for the MagicBlock Side Track at Cypherpunk Hackathon, the platform provides sub-100ms protection by analyzing swap routes across multiple DEXs (Jupiter, Raydium, Orca), detecting MEV risks, and executing protected transactions through optimized batching strategies.

**Core Value Proposition:** Transparent, verifiable protection with real savings metrics - users can see exactly how much they save on each swap with cryptographic proof of route selection.

**Current Status:** MVP complete in simulation mode. All features implemented except smart contract deployment (documented in SMART_CONTRACTS_REQUIREMENTS.md).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite with hot module replacement
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Components:** Radix UI primitives with custom shadcn/ui implementation
- **Styling:** Tailwind CSS with custom design system

**Design System:**
- Hybrid approach inspired by fintech platforms (Stripe clarity + Linear minimalism)
- Typography: Inter for UI, JetBrains Mono for code/data display
- Component library: Extensive set of 40+ Radix UI components (accordion, dialog, dropdown, toast, etc.)
- Theme: Light/dark mode support with CSS custom properties
- Layout: 12-column grid system with responsive breakpoints

**Key Frontend Patterns:**
- Real-time updates via WebSocket connection (`useWebSocket` hook)
- Optimistic UI updates with query invalidation
- Component-driven architecture with reusable UI primitives
- Form validation with react-hook-form and Zod schemas

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript (ESM modules)
- **Framework:** Express.js for HTTP server
- **Database ORM:** Drizzle ORM with Neon serverless PostgreSQL
- **Real-time:** WebSocket server for live transaction updates
- **AI Integration:** OpenAI API (GPT-5) via Replit AI Integrations

**API Design:**
- RESTful endpoints for transaction simulation and execution
- WebSocket protocol for real-time status updates
- Shared schema validation using Zod (client/server type safety)

**Core Business Logic:**

1. **Swap Simulation Flow:**
   - Accepts user swap intent (input token, output token, amount)
   - Generates AI-powered risk analysis using OpenRouter (Claude 3.5 Sonnet)
   - Compares routes across multiple DEXs (Jupiter, Raydium, Orca)
   - Calculates MEV risk scores and potential savings
   - Returns simulation results with cryptographic proof hash

2. **Batch Execution Strategy:**
   - Transactions queued into batches for optimal gas savings
   - Two execution triggers: size threshold (5 txns) or time threshold (30s)
   - Batching reduces MEV attack surface by obfuscating individual transactions
   - Real-time broadcast of batch execution status via WebSocket (exponential backoff reconnection)

3. **Risk Analysis Engine:**
   - AI-driven anomaly detection for sandwich attacks, front-running
   - Four risk levels: LOW (0-30), MEDIUM (31-70), HIGH (71-90), CRITICAL (91-100)
   - Factors considered: slippage, price impact, liquidity depth, historical MEV patterns

4. **SDK Public API:**
   - RESTful endpoints for third-party integration (/api/sdk/simulate, /api/sdk/execute, /api/sdk/risk-analysis)
   - API key authentication with SHA-256 hashing
   - Rate limiting: 60 requests/minute per API key
   - Interactive API playground and documentation at /sdk

5. **Portfolio-Level Protection:**
   - Portfolio dashboard at /portfolio showing active and completed batches
   - Multi-transaction risk analysis across user's portfolio
   - Batch transaction tracking and execution history
   - Portfolio-wide MEV protection metrics and savings aggregation

### Data Storage Solutions

**Database:** PostgreSQL (via Neon serverless)

**Schema Design:**

1. **Transactions Table** - Core transaction records
   - User wallet address, token pairs, amounts
   - Risk analysis (score, level, MEV detection flags)
   - Route selection data, execution status
   - Timestamps, batch references

2. **Route Comparisons** - DEX route analysis
   - Per-transaction comparison of Jupiter, Raydium, Orca
   - Output estimates, price impact, slippage, MEV risk per route
   - Selected route indicator

3. **Risk Analyses** - Detailed AI assessments
   - Threat indicators, vulnerability scores
   - AI-generated recommendations
   - Confidence metrics

4. **Proof of Routes** - Cryptographic verification
   - Unique proof hashes for route selection
   - Full reasoning data with timestamp
   - Signature for verifiability

5. **User Statistics** - Aggregated metrics per wallet
   - Total transactions, cumulative savings
   - Average risk scores, MEV blocks count

6. **Batches** - Execution batch tracking
   - Batch status, transaction count
   - Combined gas savings, execution timestamp

**Data Access Layer:**
- Repository pattern via `storage.ts` interface
- Type-safe queries using Drizzle ORM
- Automatic timestamp management
- Transaction isolation for batch operations

### Authentication and Authorization

**Current Implementation:** Mock wallet address for demonstration
- Wallet address: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- WebSocket authentication via URL token parameter
- Session-based approach expected for production (connect-pg-simple installed)

**Production Considerations:**
- Solana wallet adapter integration (Phantom, Solflare)
- Message signing for wallet ownership verification
- Session storage in PostgreSQL
- CORS configuration for cross-origin wallet requests

### External Dependencies

**Third-Party Services:**

1. **OpenAI API (GPT-5)**
   - Purpose: AI-powered risk analysis and route recommendations
   - Integration: Replit AI Integrations (managed API key)
   - Usage: Generates human-readable threat assessments and optimization suggestions

2. **Neon Database**
   - Purpose: Serverless PostgreSQL hosting
   - Integration: WebSocket-based connection pooling via `@neondatabase/serverless`
   - Configuration: Connection string via `DATABASE_URL` environment variable

3. **Google Fonts CDN**
   - Fonts: Inter, JetBrains Mono, DM Sans, Fira Code, Geist Mono, Architects Daughter
   - Purpose: Typography system for UI and data display

**DEX Integrations (Planned):**
- Jupiter Aggregator API (Solana)
- Raydium DEX protocol
- Orca DEX protocol

**Development Tools:**
- Replit-specific plugins: runtime error modal, cartographer, dev banner
- Drizzle Kit for database migrations
- ESBuild for production bundling

**Key Dependencies:**
- Express.js - Web server framework
- Drizzle ORM - Database toolkit
- React Query (TanStack Query v5) - Server state management
- Zod - Runtime type validation
- Radix UI - Accessible component primitives
- Recharts - Data visualization
- WebSocket (ws) - Real-time bidirectional communication
- OpenRouter API - AI risk analysis (Claude 3.5 Sonnet)
- crypto - Cryptographic hashing for proofs and API keys

**Recent Updates (Oct 25, 2025):**
- ✅ Migrated from OpenAI to OpenRouter API with Claude 3.5 Sonnet
- ✅ Implemented Proof-of-Route display with cryptographic verification
- ✅ Created SDK Public API with secure authentication and rate limiting
- ✅ Built Portfolio page with batch tracking and metrics
- ✅ Added tooltips for complex features (MEV protection explanations)
- ✅ Improved WebSocket reliability with exponential backoff reconnection
- ✅ Comprehensive end-to-end testing (32-step user journey validated)
- ✅ Created SMART_CONTRACTS_REQUIREMENTS.md for MagicBlock Ephemeral Rollups integration