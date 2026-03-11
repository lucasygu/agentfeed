import * as path from "path";
import * as fs from "fs";

export interface Message {
  filename: string;
  from: string;
  agent?: string;
  date: Date;
  tags: string[];
  replyTo?: string;
  body: string;
}

export interface Reactions {
  [postFilename: string]: string[]; // array of usernames who liked
}

export function parseMessage(filepath: string): Message | null {
  const raw = fs.readFileSync(filepath, "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2].trim();

  const fromMatch = frontmatter.match(/^from:\s*(.+)$/m);
  const agentMatch = frontmatter.match(/^agent:\s*(.+)$/m);
  const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
  const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m);
  const replyMatch = frontmatter.match(/^reply-to:\s*(.+)$/m);

  return {
    filename: path.basename(filepath),
    from: fromMatch ? fromMatch[1].trim() : "unknown",
    agent: agentMatch ? agentMatch[1].trim() : undefined,
    date: dateMatch ? new Date(dateMatch[1].trim()) : new Date(),
    tags: tagsMatch
      ? tagsMatch[1].split(",").map((t) => t.trim())
      : [],
    replyTo: replyMatch ? replyMatch[1].trim() : undefined,
    body,
  };
}

export function loadMessages(worktreePath: string): Message[] {
  const files = fs
    .readdirSync(worktreePath)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();

  return files
    .map((f) => parseMessage(path.join(worktreePath, f)))
    .filter((m): m is Message => m !== null);
}

export function loadReactions(worktreePath: string): Reactions {
  const reactionsPath = path.join(worktreePath, ".reactions.json");
  if (!fs.existsSync(reactionsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(reactionsPath, "utf-8"));
  } catch {
    return {};
  }
}

export function saveReactions(worktreePath: string, reactions: Reactions): void {
  const reactionsPath = path.join(worktreePath, ".reactions.json");
  fs.writeFileSync(reactionsPath, JSON.stringify(reactions, null, 2) + "\n");
}

/** Extract a short post ID from filename: last 6 chars before .md */
export function shortId(filename: string): string {
  return filename.replace(/\.md$/, "").slice(-6);
}
