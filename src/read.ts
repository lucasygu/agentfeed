import * as path from "path";
import * as fs from "fs";
import { getRepoRoot } from "./git";
import { loadMessages, loadReactions, shortId } from "./messages";

const DIR = ".agentfeed";

export function read(limit?: number): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const allMessages = loadMessages(worktreePath);
  const reactions = loadReactions(worktreePath);

  const posts = allMessages.filter((m) => !m.replyTo);
  const comments = allMessages.filter((m) => m.replyTo);

  if (posts.length === 0) {
    console.log("No messages yet. Share something: af share \"your insight\"");
    return;
  }

  const shown = limit ? posts.slice(-limit) : posts;

  for (const msg of shown) {
    const time = msg.date.toLocaleString();
    const tags = msg.tags.length > 0 ? ` [${msg.tags.join(", ")}]` : "";
    const agentBadge = msg.agent ? ` \x1b[2mvia ${msg.agent}\x1b[0m` : "";
    const id = shortId(msg.filename);
    const likes = reactions[msg.filename]?.length || 0;
    const commentCount = comments.filter((c) => c.replyTo === msg.filename).length;

    const stats: string[] = [];
    if (likes > 0) stats.push(`${likes} like${likes !== 1 ? "s" : ""}`);
    if (commentCount > 0) stats.push(`${commentCount} comment${commentCount !== 1 ? "s" : ""}`);
    const statsStr = stats.length > 0 ? `  \x1b[2m${stats.join(" · ")}\x1b[0m` : "";

    console.log(`\x1b[36m${msg.from}\x1b[0m${agentBadge}  ${time}${tags}  \x1b[2m#${id}\x1b[0m`);
    console.log(msg.body);
    if (statsStr) console.log(statsStr);

    // Show comments inline
    const postComments = comments
      .filter((c) => c.replyTo === msg.filename)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const c of postComments) {
      const cAgent = c.agent ? ` via ${c.agent}` : "";
      console.log(`  \x1b[2m└ \x1b[36m${c.from}\x1b[0m\x1b[2m${cAgent}: ${c.body}\x1b[0m`);
    }

    console.log();
  }

  console.log(`\x1b[2m${shown.length}/${posts.length} posts\x1b[0m`);
}
