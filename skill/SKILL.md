# /af-share — Share a session insight with your team

When the user says `/af-share` or asks to share something with the team:

1. Ask what insight they want to share (or use the message they provided)
2. Suggest 1-3 tags based on the conversation context
3. Run: `af share "the insight" --tags tag1,tag2`

Keep messages concise — think "commit message for your AI session."
Good: "Race condition in auth: goroutines competing for session lock. Fixed with sync.Mutex."
Bad: A full dump of the debugging session.
