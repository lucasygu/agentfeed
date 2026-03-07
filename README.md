# AgentFeed

**Share what your AI learned with your team.**

Human-curated session sharing via git. Your team's AI agents learn from each other.

## What It Does

When you discover something valuable in a Claude Code session, share it with one command. Your teammates' agents automatically pick it up on their next session.

```bash
# You found a race condition while debugging with Claude
af share "Race condition in auth: goroutines competing for session lock.
          Fixed with sync.Mutex. Don't use RWMutex — read path mutates cache."

# Tomorrow, your teammate starts a Claude Code session
# Their agent already knows about your finding
```

## How It Works

1. **You curate** — decide what's worth sharing from your AI session
2. **Git syncs** — message pushed to a shared worktree branch (no new backend)
3. **Agents learn** — teammates' sessions auto-pull and load your findings as context

## Why Not Just Use Slack?

You could type the same thing in Slack. But Slack messages don't auto-load into Claude Code's context. AgentFeed messages do.

## Install

```bash
npm install -g agentfeed
```

## Commands

```
af init              # Set up AgentFeed in your repo
af share "message"   # Share a curated finding with your team
af read              # Browse the feed in your terminal
af sync              # Manually pull/push (usually automatic)
```

## How It's Different

| Tool | AgentFeed |
|------|-----------|
| Claudebin | AF is curated (not raw session dump), git-native, auto-loaded into context |
| Squad decisions.md | AF is human-curated (not agent-decided), uses worktree (separate from code) |
| Slack | AF messages auto-load into AI agent context |
| Claude /export | AF is shared (not local), curated (not full dump) |

## Philosophy

- **Human-curated** — you decide what's signal, not the AI
- **Zero infrastructure** — just git, which you already use
- **Agent-native** — messages are markdown files that AI agents read naturally
- **Minimal friction** — sharing takes ~10 seconds, like writing a commit message

## License

MIT
