const { execSync } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const path = require("path");

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

const FORBIDDEN_SOURCES = ["homol"];

const gitDir = run("git rev-parse --git-dir");
if (!gitDir) process.exit(0);

const mergeHeadFile = path.join(gitDir, "MERGE_HEAD");
if (!existsSync(mergeHeadFile)) process.exit(0);

const mergeShas = readFileSync(mergeHeadFile, "utf8").trim().split("\n");

for (const sha of mergeShas) {
  for (const branch of FORBIDDEN_SOURCES) {
    const tip = run(`git rev-parse ${branch}`);
    if (!tip) continue;

    const isFromBranch =
      tip === sha ||
      run(`git merge-base --is-ancestor ${sha} ${branch} && echo yes`) ===
        "yes";

    if (isFromBranch) {
      console.error(red(`\n[hook] Merge de "${branch}" é proibido.`));
      console.error(
        `"${branch}" pode conter código não aprovado pelo cliente.`
      );
      console.error("\nPara desfazer:");
      console.error("  git merge --abort\n");
      process.exit(1);
    }
  }
}
