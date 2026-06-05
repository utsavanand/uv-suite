# Feature request: personal to-do list API

Build a small HTTP API for one person's to-do list.

Operations:
- Add a task (a title string)
- List all tasks
- Mark a task done
- Delete a task

Constraints:
- Single user. No authentication, no accounts, no login.
- About 100 tasks total, ever. A few requests per minute at most.
- Persist tasks to a local SQLite file.
- Runs as one process on one machine.
