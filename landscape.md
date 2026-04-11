# UV Suite — Open Source Landscape & References

What already exists for each UV Suite agent. Tools to integrate, repos to learn from, and practices to adopt.

---

## 1. Cartographer (Codebase Mapping)

**The output should be a knowledge graph**, not just Markdown. The leading tools prove this:

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [Graphify](https://github.com/safishamsi/graphify) | Growing fast | Tree-sitter AST + LLM semantic extraction into a queryable knowledge graph. Exports graph.html, graph.json, GRAPH_REPORT.md. Multimodal (reads PDFs, screenshots, diagrams). Works as a Claude Code skill. | **Integrate directly.** Graphify is already a Claude Code skill. The Cartographer should use it or produce the same outputs: interactive graph + JSON + report. |
| [Repomix](https://github.com/yamadashy/repomix) | 22k+ | Packs entire codebase into a single AI-friendly file with smart token compression. | Use as a pre-step: Repomix flattens the repo for initial context, then the Cartographer builds the graph on top. |
| [Aider repo-map](https://github.com/Aider-AI/aider) | 39k+ | Builds a map of the entire codebase showing which functions/classes are in which files and how they connect. | Aider's repo-map approach (function-level index) is lighter than a full knowledge graph. Good for the quick-scan mode. |
| [CodeGraph](https://github.com/colbymchenry/codegraph) | — | Pre-indexed code knowledge graph for Claude Code. Fewer tokens, fewer tool calls. | Shows that graph-based context is 6.8x fewer tokens than raw file reads. The Cartographer should produce a reusable index, not a one-shot doc. |
| [code-to-knowledge-graph](https://github.com/Bevel-Software/code-to-knowledge-graph) | — | Kotlin/JVM toolkit using LSP to build knowledge graphs. | The LSP approach (Language Server Protocol) gives type-level precision that Tree-sitter alone misses. |
| [Neo4j Codebase KG](https://neo4j.com/blog/developer/codebase-knowledge-graph/) | — | Uses Neo4j property graph for codebase representation with Cypher queries. | Property graph model (nodes = files/functions/classes, edges = calls/imports/depends-on) is the right data model. |

**Recommendation for UV Suite:** The Cartographer should output a **property graph** (not just Mermaid diagrams) that can be queried. Consider integrating Graphify directly as the underlying engine, or adopting its output format (graph.json + graph.html + GRAPH_REPORT.md).

---

## 2. Reviewer (Code Review)

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [PR-Agent / Qodo Merge](https://github.com/qodo-ai/pr-agent) | 10k+ | The original open-source AI PR reviewer. Slash commands (/review, /describe, /improve). Supports GitHub, GitLab, Bitbucket. | **The slash-command pattern is validated.** PR-Agent's /review, /describe, /improve map directly to UV Suite's skill approach. Their review checklist and output format are battle-tested. |
| [SonarQube](https://github.com/SonarSource/sonarqube) | 10k+ | The most mature code quality platform. 5000+ rules across 30+ languages. | Deterministic rules should complement AI judgment. The Reviewer should run SonarQube/Semgrep first, then layer AI analysis on top. |
| [Ruff](https://github.com/astral-sh/ruff) | 40k+ | Python linter/formatter. Extremely fast (100x faster than flake8). | For Python projects, the auto-lint hook should use Ruff, not prettier. Already the default in the Python world. |

**Key insight from the ecosystem:** The best practice is to combine static analysis (deterministic, fast, zero false negatives on known patterns) with AI review (semantic understanding, catches logic bugs). PR-Agent's 64.3% F1 score on CodeReviewBench shows AI review is good but not sufficient alone.

**Recommendation:** The `/review` skill should invoke Semgrep or SonarQube first (if available), then pass the static analysis results to the Reviewer agent as additional context.

---

## 3. Anti-Slop Guard

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [SloppyLint](https://github.com/rsionnach/sloppylint) | New | Python slop detector: over-engineering, hallucinations, dead code. Calculates deficit scores. | Validates that "AI slop" is a real category people are building tooling for. The patterns UV Suite detects are the right ones. |
| [GPTLint](https://github.com/gptlint/gptlint) | — | Uses LLMs to enforce custom best practices. Write rules in natural language. | The idea of LLM-as-linter for subjective quality is exactly what the Anti-Slop Guard does. GPTLint shows this works. |
| [ai-slop-detector](https://pypi.org/project/ai-slop-detector/) | — | Calculates logical density ratio (LDR), grades from "clean" to "suspicious". | The LDR metric is interesting: ratio of meaningful logic to boilerplate. Could quantify slop severity objectively. |

**Key insight:** Greptile's analysis found that AI-generated code lines per developer grew from 4,450 to 7,839 in 2025, with PR review time increasing 91%. Slop detection is a real and growing need.

**Recommendation:** The Anti-Slop Guard should consider a quantitative metric (like LDR) in addition to pattern matching, so teams can track slop levels over time.

---

## 4. Test Writer

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [EvoMaster](https://github.com/WebFuzzing/EvoMaster) | — | First open-source AI tool for auto-generating system-level test cases. REST, GraphQL, gRPC. Uses evolutionary algorithms. | Good for API-level integration tests. The Test Writer should know about this for web service testing. |
| [Qodo (formerly CodiumAI)](https://www.qodo.ai/) | — | AI test generation that understands code behavior, not just structure. Generates meaningful tests. | Their approach: analyze the code's behavior, identify edge cases, generate tests that would catch real bugs. This is exactly the Test Writer's philosophy. |
| [Schemathesis](https://github.com/schemathesis/schemathesis) | — | API testing from OpenAPI/GraphQL schemas. Property-based testing. | Schema-driven test generation is underused. If a project has an OpenAPI spec, the Test Writer should use it. |

**Key insight from GitHub's spec-driven development blog:** Tests should be generated from specs, not from code. If the spec says "returns 404 for missing resource," the test should verify that — regardless of how the code implements it.

**Recommendation:** The Test Writer should check for OpenAPI specs, GraphQL schemas, or formal specs before generating tests. Schema-driven testing > code-driven testing.

---

## 5. Eval Writer

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [DeepEval](https://github.com/confident-ai/deepeval) | Large | Pytest-like LLM evaluation. 50+ metrics (G-Eval, hallucination, relevancy). Runs in CI. | **The standard.** The Eval Writer should output DeepEval-compatible test cases. `deepeval test run` in CI is the target. |
| [EleutherAI lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) | Very large | Powers HuggingFace Open LLM Leaderboard. 60+ academic benchmarks. | For model-level evaluation (not app-level). Relevant when evaluating which model to use for an agent. |
| [OpenAI Evals](https://github.com/openai/evals) | Large | Framework for evaluating LLMs with a registry of standard evals. | The eval case format (input, expected, grading) is well-established. UV Suite's format should be compatible. |

**Recommendation:** The Eval Writer should default to producing DeepEval-compatible output. DeepEval's pytest integration means evals run in CI automatically — which is the whole point.

---

## 6. Security Agent

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [Semgrep](https://github.com/semgrep/semgrep) | 9k+ | Fast SAST for 30+ languages. 4000+ rules with OWASP Top 10 mappings. Pattern-based (looks like source code). | **Should be the foundation.** The Security Agent should run Semgrep first, then layer AI analysis for semantic/business-logic vulnerabilities Semgrep can't catch. |
| [OWASP ZAP](https://github.com/zaproxy/zaproxy) | 13k+ | DAST (Dynamic Application Security Testing). Finds runtime vulnerabilities. | Complement to SAST. If a dev server is running, the Security Agent could trigger a ZAP scan. |
| [Trivy](https://github.com/aquasecurity/trivy) | 25k+ | Vulnerability scanner for containers, filesystems, git repos. Fast dependency scanning. | Better than `npm audit` for multi-language dependency scanning. The security-review skill should use Trivy if available. |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | 18k+ | Secret detection in git repos. Fast, accurate. | Better than the grep-based secret scan in the current skill. The skill should use Gitleaks if installed. |

**Recommendation:** The `/security-review` skill should detect which tools are available (Semgrep, Trivy, Gitleaks) and use them, falling back to the grep-based approach only when nothing is installed.

---

## 7. Spec Writer & Architect

| Tool | Stars | What it does | What UV Suite should learn |
|------|-------|-------------|---------------------------|
| [spec-kit (GitHub)](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) | — | GitHub's open-source toolkit for spec-driven development. Works with Copilot, Claude Code, Gemini CLI. | Validates the spec-first approach UV Suite takes. The spec format should be compatible with spec-kit. |
| [ADR GitHub](https://github.com/joelparkerhenderson/architecture-decision-record) | Large | Comprehensive ADR templates and examples. MADR format is the standard. | The Architect should output ADRs in MADR 4.0 format (the de facto standard). |
| [Kiro (AWS)](https://kiro.dev/) | — | AWS's agentic IDE built around spec-driven development. Specs are the primary artifact, code is generated from them. | Confirms that spec-driven is the direction the industry is moving. UV Suite's workflow (Spec → Architect → Acts) aligns. |

---

## 8. Cross-Cutting: Skills & Agent Collections

| Repo | Stars | What it is | What UV Suite should learn |
|------|-------|-----------|---------------------------|
| [everything-claude-code](https://github.com/affaan-m/everything-claude-code) | 5.2k+ | Production-ready agents, skills, hooks, rules, MCP configs. 10+ months of daily use. | The most battle-tested Claude Code setup. Compare UV Suite's agent definitions against theirs. |
| [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | — | 1000+ community agent skills. Cross-platform. | UV Suite could publish its agents here for community distribution. |
| [claude-skills](https://github.com/alirezarezvani/claude-skills) | 5.2k+ | 220+ skills across engineering, marketing, product, compliance. | Shows the breadth possible. UV Suite is focused on engineering — but the framework applies to other domains. |
| [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | — | 1,370+ installable skills with CLI installer and bundles. | The installer concept is mature. UV Suite's install.sh approach is aligned. |

---

## 9. Karpathy's Workflow (2026)

Key takeaways from Karpathy's public notes on agentic engineering:

1. **80/20 flip:** From 80% manual coding to 80% agent delegation (December 2025 threshold)
2. **Macro actions:** Delegate entire functionalities, not individual functions
3. **Fast feedback loops:** Fast compilation, fast tests, fast tool responses enable productive agentic workflows
4. **Write for agents first:** Structure code, specs, and standards for agent consumption
5. **Supervision, not authorship:** You orchestrate, the agents execute

**How this maps to UV Suite:**
- UV Acts (Acts methodology) = macro-action delegation
- UV Guard (hooks, guardrails) = fast feedback loops (auto-lint, slop check on every write)
- UV Index (CLAUDE.md, knowledge graphs) = writing for agents first
- UV Auto (persona) = the 80% delegation mode
- HITL (cycle budgets) = supervision framework

---

## Summary: What UV Suite Should Integrate

| Priority | Integration | Why |
|----------|------------|-----|
| **High** | Graphify or similar knowledge graph for Cartographer output | Property graph > Markdown diagrams. Queryable, reusable, token-efficient. |
| **High** | Semgrep for Security Agent | Deterministic SAST should run before AI analysis. 4000+ rules, OWASP mapped. |
| **High** | DeepEval for Eval Writer output format | Pytest-compatible, runs in CI, 50+ metrics. The standard. |
| **Medium** | Gitleaks for secret detection in /security-review | Better than grep. Fast, accurate, maintained. |
| **Medium** | Trivy for dependency scanning in /security-review | Better than npm audit. Multi-language. |
| **Medium** | ADR MADR 4.0 format for Architect output | Industry standard ADR format. |
| **Low** | Repomix for large-codebase context packing | Useful pre-step before Cartographer on large repos. |
| **Low** | SonarQube rules integration for Reviewer | Complement AI judgment with deterministic rules. |

Sources:
- [Graphify - Knowledge Graph Skill](https://github.com/safishamsi/graphify)
- [Repomix - Codebase Packing](https://github.com/yamadashy/repomix)
- [Aider - AI Pair Programming](https://github.com/Aider-AI/aider)
- [PR-Agent / Qodo Merge](https://github.com/qodo-ai/pr-agent)
- [SonarQube](https://github.com/SonarSource/sonarqube)
- [Ruff - Python Linter](https://github.com/astral-sh/ruff)
- [SloppyLint - AI Slop Detector](https://github.com/rsionnach/sloppylint)
- [GPTLint - LLM-based Linter](https://github.com/gptlint/gptlint)
- [DeepEval - LLM Evaluation](https://github.com/confident-ai/deepeval)
- [EleutherAI Eval Harness](https://github.com/EleutherAI/lm-evaluation-harness)
- [Semgrep - SAST](https://github.com/semgrep/semgrep)
- [Trivy - Vulnerability Scanner](https://github.com/aquasecurity/trivy)
- [Gitleaks - Secret Detection](https://github.com/gitleaks/gitleaks)
- [OWASP ZAP - DAST](https://github.com/zaproxy/zaproxy)
- [spec-kit - GitHub's Spec-Driven Development](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [ADR Templates](https://github.com/joelparkerhenderson/architecture-decision-record)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)
- [Karpathy on Agentic Engineering](https://x.com/karpathy/status/2015883857489522876)
- [Greptile on AI Slop](https://www.greptile.com/blog/ai-slopware-future)
- [Karpathy's AI Workflow Shift](https://www.the-ai-corner.com/p/andrej-karpathy-ai-workflow-shift-agentic-era-2026)
