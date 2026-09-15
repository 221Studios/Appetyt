import { createSandboxProvider } from "@ai-hero/sandcastle";
import { cursor } from "@ai-hero/sandcastle/agents";
import { defineCommand } from "@ai-hero/sandcastle";

const MAX_ITERATIONS = 8;

export default defineCommand({
  name: "ralph-cursor",
  description: "Appetyt recipe ingest: sequential implement → review",

  async run({ ctx }) {
    const { log } = ctx;

    const worktree = await ctx.git.createWorktree({
      name: `ralph-${Date.now()}`,
    });

    await worktree.ready();
    log.info(`Worktree: ${worktree.path}`);

    const sandbox = await ctx.sandbox.create({
      workdir: worktree.path,
      provider: createSandboxProvider("local"),
      timeoutMs: 6 * 60 * 60 * 1000,
    });

    await sandbox.ready();
    log.info(`Sandbox: ${sandbox.id}`);

    const agent = cursor({
      sandbox,
      model: "composer-2.5-fast",
      local: { cwd: worktree.path },
    });

    await agent.ready();

    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      log.info(`=== Iteration ${iteration}/${MAX_ITERATIONS} ===`);

      const implSession = await agent.prompt({
        promptFile: "./.sandcastle/implement-prompt.md",
        hooks: {
          onSandboxReady: [
            "test -d .venv || python3 -m venv .venv",
            ".venv/bin/pip install -q yt-dlp",
          ],
        },
        timeout: { idleTimeoutSeconds: 2400 },
      });

      await implSession.ready();
      const implResult = await implSession.wait();
      log.info(`Implement: ${implResult.status}`);

      if (implResult.status !== "success") {
        log.error("Implement failed — stopping");
        break;
      }

      const hasChanges = await worktree.hasChanges();
      const hasCommits = await worktree.hasCommits();

      if (!hasChanges && !hasCommits) {
        log.info("No changes — all issues complete");
        break;
      }

      if (hasChanges) {
        await worktree.commitRemaining("RALPH: leftover uncommitted changes");
      }

      const reviewSession = await agent.prompt({
        promptFile: "./.sandcastle/review-prompt.md",
        timeout: { idleTimeoutSeconds: 2400 },
      });

      await reviewSession.ready();
      const reviewResult = await reviewSession.wait();
      log.info(`Review: ${reviewResult.status}`);

      if (reviewResult.status !== "success") {
        log.error("Review failed — skipping merge");
        break;
      }

      await ctx.git.merge({
        source: worktree.branch,
        target: "main",
      });
      log.info(`Merged ${worktree.branch} → main`);
    }

    await sandbox.destroy();
    log.info("Sandbox destroyed");
  },
});
