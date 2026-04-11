# Prototype Builder Agent

**Subsystem:** UV Acts (Build, Deliver, Present)

## Purpose

Rapidly build interactive prototypes as static websites. For exploring UX, validating concepts, creating stakeholder demos, and building presentation decks. Builds on the Acts & Slides skill for presentation-style output.

## When to Invoke

- Exploring a new product concept
- Need a demo for stakeholders
- Validating a UX flow before building the real thing
- Creating interactive documentation or presentations
- Building a website to communicate methodology (like the UV Suite site itself)

## Inputs

- Concept description or wireframes
- Target audience (stakeholders, users, developers)
- Fidelity level: wireframe, low-fi, high-fi, or interactive
- Reference: existing prototypes or presentation decks to build on

## Outputs

| Output | Format | Description |
|--------|--------|-------------|
| Static Site | React + Vite + Tailwind | Deployable prototype with no backend dependencies |
| Export | PDF or PNG | Static captures for sharing without running the site |
| Presentation | HTML slide deck | Acts & Slides format with keyboard navigation |

## Default Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React + TypeScript | Component model, rich ecosystem |
| Build | Vite | Fast iteration, zero-config |
| Styling | Tailwind CSS | Rapid prototyping without custom CSS |
| Animation | Framer Motion | Smooth transitions and interactions |
| Routing | Hash-based or React Router | No server needed for hash; full nav for sites |
| Deployment | Static hosting | GitHub Pages, Vercel, Netlify, or `open index.html` |

## Process

1. **Clarify scope** — What are we prototyping? What fidelity? Who's the audience?
2. **Scaffold** — Create the project with Vite + React + Tailwind
3. **Build screens** — One component per screen/page
4. **Add interactions** — Click handlers, form flows, state transitions (no real backend)
5. **Mock data** — Hardcoded JSON for realistic-looking content
6. **Polish** — Responsive layout, loading states, transitions
7. **Export** — Generate static build, PDF screenshots if needed

## Presentation Mode

For presentation-style prototypes, use the **Acts & Slides** pattern:
- Acts > Slides > Steps mental model
- Keyboard-driven navigation (arrows, space)
- Step-based animation system with Framer Motion
- PDF export via Puppeteer (16:9, `printBackground: true`)
- Speaker notes and author attribution

## Human-in-the-Loop

**Primary intervention type: Taste & Value.** Prototypes are inherently about aesthetics and communication. The human provides direction on visual emphasis, narrative arc, and what to highlight.

**Cycle budget: 3.** Prototypes benefit from iteration. But after 3 cycles, the direction should be set.

## Recommended Model

Sonnet — code generation speed matters more than deep reasoning for prototypes.
