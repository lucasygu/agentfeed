# CLAUDE.md - AgentFeed

## Project Overview

**AgentFeed** is a lightweight CLI tool and Claude Code skill for human-curated session sharing via git. Developers share curated insights from their AI sessions, which are automatically loaded into teammates' AI agent context on their next session.

## Architecture

```
agentfeed/
├── src/                    # CLI source code
│   ├── index.ts            # Entry point, CLI commands
│   ├── init.ts             # af init — set up worktree branch
│   ├── share.ts            # af share — write message, commit, push
│   ├── read.ts             # af read — display feed in terminal
│   └── sync.ts             # af sync — pull/push shared branch
├── skill/                  # Claude Code skill
│   └── SKILL.md            # /af-share skill definition
├── rules/                  # Claude Code rules
│   └── agentfeed-context.md # Auto-load feed context rule
├── package.json
├── tsconfig.json
└── README.md
```

## Key Design Decisions

- **Git worktree** for the shared branch — keeps feed separate from code commits
- **File-per-message** format — conflict-free (two people can share simultaneously)
- **YAML frontmatter** — metadata (from, date, tags) for each message
- **Append-only** — no edits, no deletes, simple conflict resolution
- **Pull-before-push** — `git pull --rebase` before every push

## Message File Format

**Filename:** `{YYYYMMDDTHHMMSS}-{sender}-{6-char-id}.md`

```markdown
---
from: username
date: 2026-03-07T14:12:30Z
tags: [auth, race-condition]
---

Message content in **markdown**.
```

## Commands

```bash
af init              # Set up .agentfeed/ on a worktree branch
af share "message"   # Write message file, commit, pull --rebase, push
af read              # Display feed messages in terminal
af sync              # Manual pull/push
```

## Tech Stack

- TypeScript
- Node.js
- Git (via child_process)
- No external dependencies beyond git

## Important

- DO NOT add a backend, database, or SaaS component
- Keep it thin — this should be ~200-300 lines of code
- Git is the only sync mechanism
- Human curation is the core value — no automatic session sharing
