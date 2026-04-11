# UV Suite — Website Concept

An interactive documentation website that makes UV Suite concepts easy to grok. Built the same way as the AI-Native Upwork presentation deck — React + TypeScript + Vite + Framer Motion + Tailwind.

---

## Why a Website?

UV Suite is currently 7+ Markdown files. That's great for portability and for agents to consume, but it's not great for:
- **First impressions** — A developer landing on UV Suite for the first time needs a visual, navigable experience
- **Team adoption** — Sharing a GitHub folder of Markdown doesn't sell the methodology
- **Concept density** — UV Index, UV Acts, UV Guard, cycle budgets, danger zones, 10 agents — this is a lot to parse linearly

The website makes UV Suite **explorable, not just readable**.

---

## Site Structure

### Home Page
- Visual overview of the three subsystems (UV Index → UV Acts → UV Guard)
- Interactive diagram showing the flow from understanding to building to guarding
- "Get started in 60 seconds" quick install
- Key stats: 10 agents, 3 subsystems, works with 3 tools

### UV Index (Understand)
- What UV Index is and why context-first matters
- The Cartographer agent: what it produces, interactive example output
- Memory and learning: how agents remember across sessions
- Context capture: from codebase analysis to documentation generation

### UV Acts (Build)
- The Acts methodology: visual timeline showing Act progression
- Interactive Airbnb example: click through Acts 1-6, see tasks, dependencies, verification
- Human-in-the-loop: the four intervention types with animated flow diagrams
- Cycle budgets: visual budget meter showing agent attempts and escalation
- Agent catalog: cards for each build-phase agent (Spec Writer, Architect, Test Writer, etc.)
- Presentation & prototyping: link to the Acts & Slides skill, example outputs

### UV Guard (Harden)
- Anti-slop: interactive before/after code examples (slop → cleaned)
- Reviewer: what it checks, example review output
- Security agent: OWASP checklist visualization
- Danger zones: interactive example of a DANGER-ZONES.md with annotations

### Collaboration
- Sharing levels: visual diagram of Personal → Project → Team → Community
- Danger zone maturity model: stages 1-4 with examples
- Team evolution: how standards improve over time
- Annotation conventions: interactive code examples with @danger, @agent-skip markers

### Installation
- Tool selector (Claude Code / Cursor / Codex) — shows tool-specific instructions
- File-per-agent architecture diagram
- Extensibility: how to add custom agents and guardrails
- Versioning: how to update without losing customizations

### Tool Comparison
- Side-by-side comparison table with feature matrix
- Recommendation engine: "If you need X, use Y"
- UV Suite portability: what travels between tools and what doesn't

---

## Technical Approach

### Reuse the AI-Native Upwork Stack

The AI-Native Upwork presentation deck (`tools/skill-ai-native-upwork/`) already has:
- React 19 + TypeScript + Vite + Framer Motion + Tailwind CSS
- Hash-based routing for navigation
- Keyboard-driven controls
- PDF export capability
- The Acts & Slides skill for structured content

**The UV Suite website should use the same stack** but as a documentation site (not a slide deck):
- React Router for page-based navigation (not hash-based slides)
- Sidebar navigation like the Upwork Docs Site (`tools/upwork-docs-site/`)
- Full-page content areas with interactive components
- Mobile responsive

### Interactive Components

| Component | Where it appears | What it does |
|-----------|-----------------|--------------|
| **Subsystem Diagram** | Home | Animated UV Index → UV Acts → UV Guard flow |
| **Acts Timeline** | UV Acts page | Visual Act progression with expandable tasks |
| **Cycle Budget Meter** | HITL section | Animated meter showing attempts and escalation |
| **Slop Detector** | UV Guard page | Before/after code panel with slop highlighted |
| **Agent Cards** | Agent catalog | Flip cards with summary on front, details on back |
| **Tool Selector** | Installation | Tab-based tool selection with dynamic content |
| **Danger Zone Map** | Collaboration | Visual codebase with highlighted danger areas |
| **Sharing Levels** | Collaboration | Concentric circle diagram of sharing scope |

### Content Source

Content lives in the UV Suite Markdown files (the source of truth). The website renders from these files — either at build time (MDX) or by converting key concepts to React components.

**Not a documentation generator.** The website is hand-crafted to make concepts visual and interactive. It references the Markdown docs but doesn't auto-render them.

---

## Relationship to Existing Sites

| Site | Purpose | How UV Suite site relates |
|------|---------|--------------------------|
| AI-Native Upwork deck | Executive presentation | Different audience (engineers, not execs) |
| Upwork Docs Site | Internal documentation hub | UV Suite site could be linked from here |
| UV Suite Markdown docs | Source of truth | Website is the visual layer on top |

**The UV Suite website is where engineers go to learn the methodology. The Markdown docs are what agents and power users consume directly.**

---

## Build Plan (Acts, naturally)

### Act 1: Foundation
- React + Vite + Tailwind project scaffolding
- Router setup, layout components, navigation
- Home page with static content

### Act 2: Core Content Pages
- UV Index, UV Acts, UV Guard pages
- Agent catalog with cards
- Acts methodology with Airbnb example

### Act 3: Interactive Components
- Subsystem flow diagram (Framer Motion)
- Acts timeline
- Slop detector before/after
- Tool selector

### Act 4: Collaboration & Installation
- Collaboration page with danger zones
- Installation guide with tool selector
- Sharing levels visualization

### Act 5: Polish
- Mobile responsive
- Keyboard navigation
- Search functionality
- Performance optimization
- PDF/HTML export of key pages
