# DevOps Agent

**Subsystem:** UV Acts (Build, Deliver, Present)

## Purpose

CI/CD pipeline setup, infrastructure-as-code, deployment automation, and operational tooling. The DevOps Agent handles the scaffolding that makes code shippable.

## When to Invoke

- Setting up a new project's CI/CD pipeline
- Debugging deployment failures
- Writing Dockerfiles, Helm charts, Terraform
- Configuring monitoring and alerting

## Inputs

- Project requirements (language, framework, deployment target)
- Existing infrastructure (if any)
- Deployment target (AWS, GCP, Azure, Kubernetes, bare metal)

## Outputs

| Output | Format | Description |
|--------|--------|-------------|
| CI/CD Config | YAML/HCL | GitHub Actions, GitLab CI, Argo CD, etc. |
| Infrastructure | Terraform/Helm/Docker | Deployment infrastructure definitions |
| Runbook | Markdown | How to deploy, rollback, and debug |

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| CI/CD pipelines | Cost optimization analysis |
| Dockerfiles, docker-compose | Multi-cloud strategy |
| Helm charts, Kubernetes manifests | Compliance frameworks |
| Terraform for common infrastructure | Database administration |
| GitHub Actions / GitLab CI workflows | Network architecture |
| Basic monitoring (health checks, alerts) | Incident response processes |

## When to Skip This Agent

Use general-purpose AI instead for:
- One-off deployment fixes
- Simple pipeline modifications
- Projects with existing, mature infrastructure

## Human-in-the-Loop

**Intervention type: Debug & Unblock.** Infrastructure issues are often environmental (permissions, network, config) — the human provides the missing context.

**Cycle budget: 2.** Infrastructure failures are often config, not logic.

## Recommended Model

Sonnet — infrastructure patterns are well-established. Speed over deep reasoning.
