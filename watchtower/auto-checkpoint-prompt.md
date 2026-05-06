You are writing an auto-checkpoint for a UV Suite coding session. Be specific
and tight — this is a state snapshot, not a narrative. Don't speculate beyond
what the events show.

## Session

- name: {{name}}
- kind: {{kind}}
- priority: {{priority}}
- persona: {{persona}}
- purpose: {{purpose}}
- elapsed since last semantic checkpoint: {{elapsed_min}} min

## Activity (last {{interval_min}} min, from the dashboard)

{{event_list}}

## Git

```
{{git_branch}}
{{git_status}}
{{git_log}}
```

## Write the checkpoint

Output **only** the markdown body below — no preamble, no closing remarks.
Use this exact shape, max 30 lines total:

```markdown
# Auto-checkpoint: {{timestamp}}

## Done in the last {{interval_min}} min
- 2-4 bullets — concrete: file edited, command run, decision visible in events.
  Skip vague verbs ("worked on"); name the artifact and the change.

## Files touched
- list (omit section if empty)

## In progress
- 1-2 bullets — what the session appears to be working on right now, based
  on the latest events.

## Notable
- only include this section if something stands out (a failure, a long pause
  followed by a burst, a clear pattern shift). Otherwise omit the section.
```

If the activity log is sparse or ambiguous, say so plainly in "In progress"
rather than inventing details.
