import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { git, gitSafe, getRepoRoot, getUsername } from "./git";

const DIR = ".agentfeed";

export function share(message: string, tags?: string[]): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const now = new Date();
  const sender = getUsername().toLowerCase().replace(/\s+/g, "-");
  const id = crypto.randomBytes(3).toString("hex");
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "");
  const filename = `${timestamp}-${sender}-${id}.md`;

  // Build frontmatter
  const lines = [
    "---",
    `from: ${sender}`,
    `date: ${now.toISOString()}`,
  ];
  if (tags && tags.length > 0) {
    lines.push(`tags: [${tags.join(", ")}]`);
  }
  lines.push("---", "", message, "");

  const filePath = path.join(worktreePath, filename);
  fs.writeFileSync(filePath, lines.join("\n"));

  // Commit in the worktree
  git(["add", filename], worktreePath);
  git(["commit", "-m", `share: ${message.slice(0, 60)}`], worktreePath);

  // Sync: pull --rebase then push
  const hasRemote = gitSafe(["remote"], worktreePath) !== null &&
    gitSafe(["remote"], worktreePath) !== "";

  if (hasRemote) {
    gitSafe(["pull", "--rebase", "origin", "agentfeed"], worktreePath);
    gitSafe(["push", "origin", "agentfeed"], worktreePath);
  }

  console.log(`Shared: ${filename}`);
}
