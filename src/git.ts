import { execFileSync } from "child_process";

export function git(args: string[], cwd?: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

export function gitSafe(args: string[], cwd?: string): string | null {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}

export function getRepoRoot(): string {
  return git(["rev-parse", "--show-toplevel"]);
}

export function getUsername(): string {
  return gitSafe(["config", "user.name"]) || process.env.USER || "anonymous";
}

export function getOwner(): string {
  // Try gh CLI for verified GitHub login
  try {
    const output = execFileSync("gh", ["auth", "status"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const match = output.match(/Logged in to github\.com account (\S+)/);
    if (match) return match[1];
  } catch {
    // gh not installed or not logged in — fall through
  }

  // Fallback to git config
  const name = getUsername();
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function getAgent(): string | undefined {
  if (process.env.CLAUDE_CODE) return "claude-code";
  if (process.env.CURSOR_TRACE_ID) return "cursor";
  if (process.env.CODEX_ENV) return "codex";
  return undefined;
}
