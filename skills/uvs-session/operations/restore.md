# restore — load a prior checkpoint

The available-sessions list (with `*` marking the current session) and the
current session's `latest.md` are printed above.
- **`REST` empty or `latest`:** read the current session's `latest.md` shown
  above. Summarize in 3-4 sentences (what was done, current state, what's next),
  including the session's name and purpose from the frontmatter. Then ask:
  "Ready to pick up from here, or do you want to take a different direction?"
- **`REST` = `list`:** just show the available-sessions list above and ask which
  one they want to restore.
- **`REST` looks like a session id prefix** (8-char hex / UUID-ish) **or a
  session name:** match it against the list, then Read the matching session's
  `<project>/uv-out/sessions/<full-session-id>/checkpoints/latest.md` (fall back
  to the legacy `<project>/uv-out/checkpoints/<full-session-id>/latest.md` if the
  new path is absent), and summarize as above.
- **No match:** list the available sessions and ask the user to pick one.
