import * as path from "path";
import * as fs from "fs";
import { git, gitSafe, getRepoRoot } from "./git";

const BRANCH = "agentfeed";
const DIR = ".agentfeed";

export function init(): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (fs.existsSync(worktreePath)) {
    console.log(`Already initialized: ${worktreePath}`);
    return;
  }

  // Create orphan branch if it doesn't exist
  const branchExists =
    gitSafe(["rev-parse", "--verify", BRANCH]) !== null ||
    gitSafe(["rev-parse", "--verify", `origin/${BRANCH}`]) !== null;

  if (!branchExists) {
    // Remember current branch to switch back
    const currentBranch = gitSafe(["rev-parse", "--abbrev-ref", "HEAD"]) || "main";

    // Create orphan branch with an initial empty commit
    git(["checkout", "--orphan", BRANCH]);
    gitSafe(["rm", "-rf", "."], root); // may fail if no tracked files
    git(["commit", "--allow-empty", "-m", "Initialize agentfeed"]);

    // Switch back to the original branch
    git(["checkout", currentBranch]);
  } else if (gitSafe(["rev-parse", "--verify", BRANCH]) === null) {
    // Branch exists on remote but not locally
    git(["fetch", "origin", BRANCH]);
    git(["branch", BRANCH, `origin/${BRANCH}`]);
  }

  // Add worktree
  git(["worktree", "add", worktreePath, BRANCH]);

  // Add .agentfeed to .gitignore if not already there
  const gitignorePath = path.join(root, ".gitignore");
  const gitignore = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf-8")
    : "";
  if (!gitignore.includes(DIR)) {
    fs.appendFileSync(gitignorePath, `\n${DIR}/\n`);
  }

  console.log(`Initialized AgentFeed at ${worktreePath}`);
  console.log(`Branch: ${BRANCH}`);
  console.log(`\nShare something: af share "your insight here"`);
}
