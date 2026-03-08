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
