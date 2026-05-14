const { execSync } = require("child_process");

const PROTECTED = ["main", "devel", "homol"];
const FORCE_PUSH_BLOCKED = ["main", "devel"];
const REQUIRE_MERGE_COMMIT = ["homol", "devel"];
const TASK_PATTERN = /^(feat|fix|chore)\/.+/;
const RELEASE_PATTERN = /^release\/.+/;

const red = (s) => `\x1b[31m${s}\x1b[0m`;

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (_) {
    return null;
  }
}

const currentBranch = run("git rev-parse --abbrev-ref HEAD");

if (
  !PROTECTED.includes(currentBranch) &&
  !TASK_PATTERN.test(currentBranch) &&
  !RELEASE_PATTERN.test(currentBranch)
) {
  console.error(red(`\n[hook] Nome de branch inválido: "${currentBranch}"`));
  console.error("Use: feat/TAREFA, fix/TAREFA, chore/TAREFA ou release/TAREFA\n");
  process.exit(1);
}

const trackingRef = run(
  "git rev-parse --abbrev-ref --symbolic-full-name @{u}"
);
if (!trackingRef) process.exit(0);

const slashIndex = trackingRef.indexOf("/");
const remoteBranch = trackingRef.slice(slashIndex + 1);

if (PROTECTED.includes(remoteBranch) && !PROTECTED.includes(currentBranch)) {
  console.error(
    red(
      `\n[hook] Não é permitido fazer push para "${remoteBranch}" a partir de "${currentBranch}".`
    )
  );
  console.error(
    `Fluxo correto: git checkout ${remoteBranch} && git merge --no-ff ${currentBranch} && git push\n`
  );
  process.exit(1);
}

if (FORCE_PUSH_BLOCKED.includes(remoteBranch)) {
  const behind = run(`git rev-list --count HEAD..${trackingRef}`);
  if (behind && parseInt(behind) > 0) {
    console.error(red(`\n[hook] Force push em "${remoteBranch}" é proibido.`));
    console.error(
      "Branches de código compartilhado e produção não podem ter histórico reescrito.\n"
    );
    process.exit(1);
  }
}

if (REQUIRE_MERGE_COMMIT.includes(remoteBranch)) {
  const localSha = run("git rev-parse HEAD");
  if (localSha) {
    const parents = (run(`git cat-file -p ${localSha}`) || "")
      .split("\n")
      .filter((l) => l.startsWith("parent"));
    if (parents.length < 2) {
      console.error(
        red(
          `\n[hook] O commit no topo de "${remoteBranch}" não é um merge commit.`
        )
      );
      console.error(
        `Use --no-ff ao integrar: git merge --no-ff <branch-de-tarefa>\n`
      );
      process.exit(1);
    }
  }
}
