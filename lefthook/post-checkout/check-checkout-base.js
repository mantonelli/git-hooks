const { execSync } = require("child_process");

const prevSha = process.argv[2];
const flag = process.argv[4];

if (flag !== "1") process.exit(0);

const PROTECTED = ["main", "devel", "homol"];
const TASK_PATTERN = /^(feat|fix|chore)\/.+/;
const RELEASE_PATTERN = /^release\/.+/;

const red = (s) => `\x1b[31m${s}\x1b[0m`;

const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
  .toString()
  .trim();

if (PROTECTED.includes(currentBranch)) process.exit(0);

if (RELEASE_PATTERN.test(currentBranch)) {
  try {
    const mainTip = execSync("git rev-parse main").toString().trim();
    if (prevSha !== mainTip) {
      console.error(
        red(
          `\n[hook] A branch "${currentBranch}" deve ser criada obrigatoriamente a partir de "main".`,
        ),
      );
      console.error("\nPara corrigir:");
      console.error(`  git checkout main`);
      console.error(`  git pull origin main`);
      console.error(`  git branch -D ${currentBranch}`);
      console.error(`  git checkout -b ${currentBranch}\n`);
    }
  } catch (_) {}
  process.exit(0);
}

for (const branch of ["main", "homol"]) {
  try {
    const tip = execSync(`git rev-parse ${branch}`).toString().trim();
    if (tip !== prevSha) continue;

    if (TASK_PATTERN.test(currentBranch)) {
      console.error(
        red(
          `\n[hook] A branch "${currentBranch}" foi criada a partir de "${branch}" (restrita).`,
        ),
      );
      console.error('Branches de tarefa devem partir sempre de "devel".');
    } else {
      console.error(
        red(
          `\n[hook] A branch "${currentBranch}" foi criada a partir de "${branch}" (restrita) e o nome não segue nenhum padrão válido.`,
        ),
      );
      console.error(
        "Use: feat/TAREFA, fix/TAREFA, chore/TAREFA ou release/TAREFA",
      );
    }
    console.error("\nPara corrigir:");
    console.error(`  git checkout devel`);
    console.error(`  git pull origin devel`);
    console.error(`  git branch -D ${currentBranch}`);
    console.error(`  git checkout -b ${currentBranch}\n`);
    break;
  } catch (_) {}
}
