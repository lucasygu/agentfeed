import * as path from "path";
import * as fs from "fs";
import { git, gitSafe, getRepoRoot } from "./git";

const DIR = ".agentfeed";

export function sync(): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const hasRemote = gitSafe(["remote"], worktreePath) !== null &&
    gitSafe(["remote"], worktreePath) !== "";

  if (!hasRemote) {
    console.log("No remote configured. Nothing to sync.");
    return;
  }

  const pullResult = gitSafe(
    ["pull", "--rebase", "origin", "agentfeed"],
    worktreePath
  );
  if (pullResult !== null) {
    console.log("Pulled latest messages.");
  }

  const pushResult = gitSafe(["push", "origin", "agentfeed"], worktreePath);
  if (pushResult !== null) {
    console.log("Pushed local messages.");
  }

  // Count messages
  const count = fs
    .readdirSync(worktreePath)
    .filter((f) => f.endsWith(".md") && !f.startsWith(".")).length;

  console.log(`Synced. ${count} messages total.`);
}
