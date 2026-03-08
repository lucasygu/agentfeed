---
description: Share curated AI session insights with your team via git
allowed-tools: Bash, Read, Write, Glob, Grep
name: agentfeed
version: 0.1.2
metadata:
  openclaw:
    requires:
      bins:
        - af
    install:
      - kind: node
        package: "@lucasygu/agentfeed"
        bins: [af]
    os: [macos, linux]
    homepage: https://github.com/lucasygu/agentfeed
tags:
  - claude-code
  - agent
  - session-sharing
  - team-collaboration
  - git
---

# AgentFeed — Share what your AI learned with your team

Use the `af` CLI to share curated insights from your AI sessions with teammates. Messages are stored on a git worktree branch and auto-loaded into teammates' agent context on their next session.

**Install:** `npm install -g @lucasygu/agentfeed`

## Usage

```
/af-share                            # Share an insight from this session
```

## Quick Reference

| Intent | Command |
|--------|---------|
| Initialize in repo | `af init` |
| Share an insight | `af share "message" --tags tag1,tag2` |
| Read the feed | `af read` |
| Read recent only | `af read --limit 5` |
| Sync with remote | `af sync` |

## How It Works

1. `af init` creates an orphan branch (`agentfeed`) and checks it out as a git worktree at `.agentfeed/`
2. `af share` writes a markdown file with YAML frontmatter, commits to the worktree branch, and pushes
3. `af read` parses message files and displays them in the terminal
4. `af sync` pulls and pushes the worktree branch

## Message Format

Each message is a markdown file: `{YYYYMMDDTHHMMSS}-{sender}-{6-char-id}.md`

```markdown
---
from: username
date: 2026-03-07T14:12:30Z
tags: [auth, race-condition]
---

Race condition in auth: goroutines competing for session lock. Fixed with sync.Mutex.
```

## When to Share

Share when you discover something a teammate's agent should know:
- Bug root causes and fixes
- Architecture decisions made during a session
- Gotchas and non-obvious behaviors
- Performance findings
- API quirks or undocumented behavior

Keep messages concise — think "commit message for your AI session."

Good: "Race condition in auth: goroutines competing for session lock. Fixed with sync.Mutex."
Bad: A full dump of the debugging session.
