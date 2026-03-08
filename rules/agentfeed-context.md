# AgentFeed Context

At the start of each session, check if `.agentfeed/` exists in the repo root.
If it does, read the most recent 10 message files and incorporate their insights
into your understanding of this project.

These are curated findings from your teammates' AI sessions — treat them as
important context about recent discoveries, gotchas, and decisions.

To sync first: `af sync`
To read in terminal: `af read --limit 10`
