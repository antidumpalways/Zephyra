# Zephyra Design Guidelines

## Design Approach

**Selected Approach:** Hybrid Design System inspired by fintech security platforms (Stripe's clarity + Linear's minimalism + trading platform data visualization)

**Core Philosophy:** "Invisible protection, visible confidence" - Users should feel secure without being overwhelmed by complexity. Every UI element reinforces trust, speed, and transparency.

**Key Design Principles:**
1. **Clarity First:** Complex security concepts presented through simple, scannable interfaces
2. **Data Transparency:** Real numbers, real savings, verifiable proof
3. **Speed Signals:** Visual indicators of sub-100ms performance throughout
4. **Trust Through Minimalism:** Clean layouts that suggest professional-grade security

---

## Typography System

**Primary Font:** Inter (via Google Fonts CDN)
- Display: 600 weight, 36-48px for hero headlines
- Headings: 600 weight, 24-32px for section titles
- Body: 400 weight, 16px for primary text
- Captions: 500 weight, 14px for labels and metrics

**Secondary Font:** JetBrains Mono (via Google Fonts CDN) 
- Used exclusively for: transaction hashes, numerical data, code snippets, API documentation
- Weight: 400 for regular code, 500 for emphasized values

**Hierarchy Rules:**
- Hero messaging uses large display type with generous letter-spacing (tracking-tight)
- Metric displays combine large numerals (JetBrains Mono 32-40px) with small unit labels (Inter 12px)
- Danger alerts use 600 weight Inter with slightly increased size (18px)

---

## Layout System

**Spacing Primitives:** Tailwind units of **4, 6, 8, 12, 16** as primary rhythm
- Component padding: p-6 or p-8
- Section spacing: py-12 (mobile), py-16 (desktop)
- Card gaps: gap-6 for grids, gap-4 for lists
- Icon-to-text spacing: gap-3

**Grid System:**
- Dashboard: 12-column grid with max-w-7xl container
- Comparison views: 2-column split (lg:grid-cols-2) with gap-8
- Feature showcases: 3-column grid (lg:grid-cols-3) for landing page
- Mobile: Always stack to single column

**Container Strategy:**
- Full-bleed hero sections with inner max-w-6xl content
- Dashboard content constrained to max-w-7xl
- Narrow reading width for documentation (max-w-prose)

---

## Component Library

### Navigation
**Desktop:** Horizontal nav with backdrop blur effect (backdrop-blur-lg)
- Fixed position with border-b separator
- Logo left, primary actions right
- "Connect Wallet" button prominently placed

**Mobile:** Hamburger menu with slide-out drawer
- Full-height overlay with navigation links
- CTA buttons stacked at bottom

### Hero Section (Landing Page)
**Layout:** Split layout with visual hierarchy
- Left: Headline + subheadline + two CTAs (primary + secondary)
- Right: Animated comparison widget showing "Safe vs Unsafe Route"

**Comparison Widget (Key Visual):**
```
┌─────────────────────────────────────┐
│  Without Zephyra        ❌          │
│  10 SOL → 1,823 USDC               │
│  Lost: $230 to MEV                 │
├─────────────────────────────────────┤
│  With Zephyra          ✅          │
│  10 SOL → 1,843 USDC               │
│  Protected: $223 saved             │
└─────────────────────────────────────┘
```
- Use subtle gradients (red tint for unsafe, green tint for safe)
- Animated counter showing savings accumulate
- Micro-interaction: Pulsing shield icon on protected route

### Dashboard Cards
**Savings Summary Card:**
- Large numeral display: Total savings (e.g., "$2,847")
- Sparkline chart showing savings over time
- Small metrics below: Transactions protected, Average savings per tx

**Transaction History Table:**
- Columns: Timestamp, Route, Amount, Risk Score, Savings
- Risk score displayed as colored badge (0-30: green, 31-70: yellow, 71-100: red)
- Expandable rows reveal Proof-of-Route details

**Risk Gauge Component:**
```
Risk Score: 87/100
[────────────█─] CRITICAL
```
- Horizontal progress bar with dynamic color fill
- Text label changes based on score range
- Positioned prominently before transaction confirmation

### Proof-of-Route Panel
**Accordion-Style Expandable Section:**
1. Route Selection Analysis
   - Shows all routes considered (Jupiter, Raydium, Orca)
   - Highlights chosen route with reasoning
2. MEV Detection Log
   - Timestamps of bot activity detected
   - Predicted sandwich attack vectors blocked
3. Execution Timeline
   - Visual timeline showing: Simulation (50ms) → Route Selection (30ms) → Execution (20ms)
   - Total time badge: "Protected in 100ms"
4. Verifiable Hash
   - Transaction signature with copy button
   - Link to Solana Explorer

### Buttons & CTAs
**Primary CTA:** 
- Solid background with sharp corners (rounded-md)
- Height: h-12, padding px-8
- Font: 600 weight, 16px
- Hover: Subtle scale transform (hover:scale-105)

**Secondary CTA:**
- Outline variant with transparent background
- Same sizing as primary
- Border thickness: border-2

**Danger/Warning Actions:**
- Use for "Execute Unsafe Route" (should discourage use)
- Red outline with warning icon

### Data Visualization
**Savings Chart (Time Series):**
- Line chart with gradient fill below curve
- X-axis: Timeline (hourly/daily selectable)
- Y-axis: Cumulative USD saved
- Tooltip on hover showing exact values

**Risk Distribution (Histogram):**
- Bar chart showing transaction count by risk score range
- Color-coded bars matching risk badge colors

### Alert Banners
**High-Risk Warning:**
```
⚠️ High MEV Risk Detected (87/100)
Guardian recommends using Protected Route
Estimated savings: $218
[Use Protected Route]  [Proceed Anyway]
```
- Yellow/orange background with dark text
- Icons for visual scanning
- Clear action buttons

**Success Confirmation:**
```
✅ Transaction Protected Successfully
Saved $223 from potential MEV attack
View Proof-of-Route →
```
- Green background with success icon
- Link to detailed proof panel

---

## Special Features Implementation

### Proof-of-Route Transparency Layer
**Design Pattern:** Expandable accordion with technical details
- Initially collapsed to avoid overwhelming users
- "View Proof" button triggers smooth expansion
- Use monospace font for technical data (hashes, timestamps)
- Include "Share Proof" button to export as verifiable JSON

### Developer API Section (Landing Page)
**Code Block Styling:**
- Dark background (near-black) with syntax highlighting
- Copy button in top-right corner
- Example SDK integration in JavaScript/TypeScript
- Use JetBrains Mono font throughout

**API Card Grid:**
- 2x2 grid showing four key SDK methods
- Each card: Method name, one-line description, "View Docs" link

---

## Images

**Hero Section:** 
- Large abstract illustration on right side showing "shield protecting transaction flow"
- Style: Geometric, minimal, uses subtle gradients
- Dimensions: ~600x600px, positioned to extend slightly beyond content width
- Alternative: Animated Lottie showing transaction routing through protected path

**Feature Section:**
- Three supporting illustrations for key features (AI Detection, Private Simulation, Batching)
- Style: Icon-based diagrams with connecting lines showing data flow
- Size: ~400x300px each

**Dashboard:**
- No decorative images; focus on data visualization
- Charts and graphs provide visual interest

**No stock photos of people** - This is a technical security product where abstract/technical visuals are more appropriate.

---

## Animation Guidelines

**Use Sparingly - Only Where Meaningful:**

1. **Counter Animations:** Savings numbers count up when card first loads (number-ticker effect)
2. **Risk Gauge Fill:** Progress bar animates from 0 to actual score over 500ms
3. **Transaction Status:** Smooth transition between "Simulating..." → "Analyzing..." → "Protected" states
4. **Accordion Expand:** Proof-of-Route details slide down smoothly (300ms ease-out)

**Avoid:**
- Parallax scrolling
- Excessive hover effects
- Auto-playing video backgrounds
- Distracting micro-interactions

---

## Responsive Behavior

**Mobile (< 768px):**
- Navigation collapses to hamburger
- Two-column grids stack to single column
- Hero section stacks: headline above, visual below
- Dashboard cards full-width with vertical scroll

**Tablet (768px - 1024px):**
- Maintain 2-column layouts where appropriate
- Slightly reduced spacing (py-10 instead of py-16)

**Desktop (> 1024px):**
- Full 3-column grids for feature showcases
- Side-by-side comparison views
- Maximum spacing for breathing room

---

## Accessibility

- All interactive elements have focus states (ring-2 ring-offset-2)
- Color is never the only indicator (icons + text labels always paired)
- Risk scores include both numerical value AND text label ("CRITICAL")
- Keyboard navigation fully supported throughout dashboard
- Form inputs have clear labels and error states