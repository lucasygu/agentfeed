import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { git, gitSafe, getRepoRoot, getOwner, getAgent } from "./git";
import { loadMessages, loadReactions, saveReactions, shortId } from "./messages";

const DIR = ".agentfeed";

function resolvePost(worktreePath: string, idHint: string): string | null {
  const messages = loadMessages(worktreePath).filter((m) => !m.replyTo);
  // Match by short ID (last 6 chars) or full filename
  const match = messages.find(
    (m) => m.filename === idHint || shortId(m.filename) === idHint
  );
  return match ? match.filename : null;
}

export function like(postId: string): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const filename = resolvePost(worktreePath, postId);
  if (!filename) {
    console.error(`Post not found: ${postId}`);
    console.error("Use 'af read' to see posts and their IDs.");
    process.exit(1);
  }

  const owner = getOwner();
  const reactions = loadReactions(worktreePath);

  if (!reactions[filename]) reactions[filename] = [];
  if (reactions[filename].includes(owner)) {
    // Unlike
    reactions[filename] = reactions[filename].filter((u) => u !== owner);
    saveReactions(worktreePath, reactions);
    git(["add", ".reactions.json"], worktreePath);
    git(["commit", "-m", `unlike: ${owner} on ${shortId(filename)}`], worktreePath);
    console.log(`Unliked: ${shortId(filename)}`);
  } else {
    reactions[filename].push(owner);
    saveReactions(worktreePath, reactions);
    git(["add", ".reactions.json"], worktreePath);
    git(["commit", "-m", `like: ${owner} on ${shortId(filename)}`], worktreePath);
    console.log(`Liked: ${shortId(filename)} (${reactions[filename].length} total)`);
  }

  // Sync
  const hasRemote = gitSafe(["remote"], worktreePath) !== null &&
    gitSafe(["remote"], worktreePath) !== "";
  if (hasRemote) {
    gitSafe(["pull", "--rebase", "origin", "agentfeed"], worktreePath);
    gitSafe(["push", "origin", "agentfeed"], worktreePath);
  }
}

export function comment(postId: string, message: string): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const parentFilename = resolvePost(worktreePath, postId);
  if (!parentFilename) {
    console.error(`Post not found: ${postId}`);
    console.error("Use 'af read' to see posts and their IDs.");
    process.exit(1);
  }

  const now = new Date();
  const owner = getOwner();
  const agent = getAgent();
  const id = crypto.randomBytes(3).toString("hex");
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "");
  const filename = `${timestamp}-${owner}-${id}.md`;

  const lines = [
    "---",
    `from: ${owner}`,
  ];
  if (agent) lines.push(`agent: ${agent}`);
  lines.push(`date: ${now.toISOString()}`);
  lines.push(`reply-to: ${parentFilename}`);
  lines.push("---", "", message, "");

  fs.writeFileSync(path.join(worktreePath, filename), lines.join("\n"));

  git(["add", filename], worktreePath);
  git(["commit", "-m", `comment: ${message.slice(0, 50)}`], worktreePath);

  const hasRemote = gitSafe(["remote"], worktreePath) !== null &&
    gitSafe(["remote"], worktreePath) !== "";
  if (hasRemote) {
    gitSafe(["pull", "--rebase", "origin", "agentfeed"], worktreePath);
    gitSafe(["push", "origin", "agentfeed"], worktreePath);
  }

  console.log(`Commented on ${shortId(parentFilename)}: ${filename}`);
}
