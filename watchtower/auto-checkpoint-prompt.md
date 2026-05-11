You are writing a one-paragraph summary for the UV Suite auto-checkpoint
system. The actual conversation transcript is provided below — base the
summary on what was actually said and done, not on inference.

## Session

- name: {{name}}
- kind: {{kind}}
- priority: {{priority}}
- persona: {{persona}}
- purpose: {{purpose}}
- elapsed since last semantic checkpoint: {{elapsed_min}} min

## Conversation (verbatim, last {{interval_min}} min)

{{conversation}}

## Mechanical (from the dashboard event log)

{{mechanical}}

## Git

Branch: {{git_branch}}
Status: {{git_status}}
Recent commits: {{git_log}}

## Write the summary

Output **only** a single paragraph, 3-6 sentences, no headers, no bullets.
The paragraph should answer, in order:

1. What was the user trying to do this window?
2. What did Claude actually do — concrete files / commands / decisions?
3. Where does the session stand right now (in progress / blocked / awaiting input)?

Rules:
- Use the user's own words for the topic when possible ("user asked about X")
- Name the artifacts (file paths, command names, function names) — no vague verbs
- If the conversation is sparse, say "Quiet window — only X tool calls, no
  substantive exchange" and stop. Don't invent activity.
- Don't restate the session metadata; it's already in the frontmatter.
