---
description: Share curated AI session insights with your team via git
allowed-tools: Bash, Read, Write, Glob, Grep
name: agentfeed
version: 0.2.0
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
/agentfeed                           # Draft and share an insight from this session
```

## How Sharing Works (Draft → Approve)

When the user triggers this skill, follow this flow:

1. **Draft a post** based on the current session — summarize what was discovered, fixed, or learned. Focus on insights a teammate's agent would benefit from knowing.

2. **Present the draft** to the user for review:
   - Show the proposed message body
   - Suggest relevant tags based on the work done
   - Ask the user to approve, edit, or skip

3. **On approval**, run the CLI command:
   ```bash
   af share "the approved message" --tags tag1,tag2
   ```

### Drafting Guidelines

Write posts that are:
- **Standalone**: A reader should understand the insight without session context
- **Concise**: 1-3 sentences. Think "post-mortem summary", not debugging log.
- **Actionable**: What should a teammate's agent know or do differently?

Good: "Race condition in auth middleware — goroutines competing for session lock. Fixed with sync.Mutex. Key: JWT validation was non-atomic with session write."

Bad: "We spent a while debugging auth issues and eventually found it was a race condition."

### Tag Suggestions

Suggest 1-3 tags based on the work. Use lowercase, hyphenated. Common tags:
- Area: `auth`, `api`, `db`, `frontend`, `infra`, `ci`
- Type: `bug-fix`, `perf`, `architecture`, `gotcha`, `migration`

## Quick Reference

| Intent | Command |
|--------|---------|
| Initialize in repo | `af init` |
| Share an insight | `af share "message" --tags tag1,tag2` |
| Read the feed | `af read` |
| Read recent only | `af read --limit 5` |
| Sync with remote | `af sync` |

## Message Format

Each message is a markdown file: `{YYYYMMDDTHHMMSS}-{owner}-{6-char-id}.md`

```markdown
---
from: lucasygu
agent: claude-code
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
