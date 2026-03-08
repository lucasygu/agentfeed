import * as path from "path";
import * as fs from "fs";
import { getRepoRoot } from "./git";

const DIR = ".agentfeed";

interface Message {
  filename: string;
  from: string;
  date: Date;
  tags: string[];
  body: string;
}

function parseMessage(filepath: string): Message | null {
  const raw = fs.readFileSync(filepath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2].trim();

  const fromMatch = frontmatter.match(/^from:\s*(.+)$/m);
  const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
  const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m);

  return {
    filename: path.basename(filepath),
    from: fromMatch ? fromMatch[1].trim() : "unknown",
    date: dateMatch ? new Date(dateMatch[1].trim()) : new Date(),
    tags: tagsMatch
      ? tagsMatch[1].split(",").map((t) => t.trim())
      : [],
    body,
  };
}

export function read(limit?: number): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const files = fs
    .readdirSync(worktreePath)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();

  if (files.length === 0) {
    console.log("No messages yet. Share something: af share \"your insight\"");
    return;
  }

  const messages = files
    .map((f) => parseMessage(path.join(worktreePath, f)))
    .filter((m): m is Message => m !== null);

  const shown = limit ? messages.slice(-limit) : messages;

  for (const msg of shown) {
    const time = msg.date.toLocaleString();
    const tags = msg.tags.length > 0 ? ` [${msg.tags.join(", ")}]` : "";
    console.log(`\x1b[36m${msg.from}\x1b[0m  ${time}${tags}`);
    console.log(msg.body);
    console.log();
  }

  console.log(`\x1b[2m${shown.length}/${messages.length} messages\x1b[0m`);
}
