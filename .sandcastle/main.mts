// Sequential Reviewer — implement-then-review loop
import { execSync } from "node:child_process";

import * as sandcastle from "@ai-hero/sandcastle";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";

const REPO_ROOT = process.cwd();

function mergeSandboxBranchToMain(branch: string): void {
  try {
    execSync("git checkout main", { cwd: REPO_ROOT, stdio: "inherit" });
    execSync(`git merge --no-edit "${branch}"`, { cwd: REPO_ROOT, stdio: "inherit" });
    console.log(`Merged ${branch} into main.`);
  } catch (error) {
    console.error(`Merge to main failed for ${branch}:`, error);
  }
}

const CURSOR_MODEL = "auto";
const cursorAgent = () =>
  sandcastle.cursor(CURSOR_MODEL, {
    env: {
      PATH: `${process.env.HOME}/.local/bin:${process.env.PATH ?? ""}`,
    },
  });

const MAX_ITERATIONS = 8;

const hooks = {
  sandbox: {
    onSandboxReady: [
      {
        command:
          "test -d .venv || python3 -m venv .venv; .venv/bin/pip install --quiet yt-dlp",
      },
    ],
  },
};

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

  const branch = `sandcastle/sequential-reviewer/${Date.now()}`;

  const sandbox = await sandcastle.createSandbox({
    branch,
    sandbox: noSandbox(),
    hooks,
  });

  try {
    const implement = await sandbox.run({
      name: "implementer",
      maxIterations: 1,
      agent: cursorAgent(),
      promptFile: "./.sandcastle/implement-prompt.md",
      idleTimeoutSeconds: 2400,
    });

    if (!implement.commits.length) {
      console.log("Implementation agent made no commits. Stopping.");
      break;
    }

    console.log(`\nImplementation complete on branch: ${branch}`);
    console.log(`Commits: ${implement.commits.length}`);

    await sandbox.run({
      name: "reviewer",
      maxIterations: 1,
      agent: cursorAgent(),
      promptFile: "./.sandcastle/review-prompt.md",
      idleTimeoutSeconds: 2400,
      promptArgs: {
        BRANCH: branch,
      },
    });

    console.log("\nReview complete.");
    mergeSandboxBranchToMain(branch);
  } finally {
    await sandbox.close();
  }
}

console.log("\nAll done.");
