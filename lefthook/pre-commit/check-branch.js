const { execSync } = require('child_process')
const { existsSync } = require('fs')
const path = require('path')

const PROTECTED = ['main', 'devel', 'homol']
const TASK_PATTERN = /^(feat|fix|chore)\/.+/
const RELEASE_PATTERN = /^release\/.+/

const red = (s) => `\x1b[31m${s}\x1b[0m`

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
const gitDir = execSync('git rev-parse --git-dir').toString().trim()
const isMerge = existsSync(path.resolve(gitDir, 'MERGE_HEAD'))

if (PROTECTED.includes(branch)) {
  if (!isMerge) {
    console.error(red(`\n[hook] Commits diretos em "${branch}" são proibidos.`))
    console.error('Trabalhe em uma branch de tarefa: feat/TAREFA, fix/TAREFA ou chore/TAREFA\n')
    process.exit(1)
  }
  process.exit(0)
}

if (!TASK_PATTERN.test(branch) && !RELEASE_PATTERN.test(branch)) {
  console.error(red(`\n[hook] Nome de branch inválido: "${branch}"`))
  console.error('Use: feat/NOME, fix/NOME, chore/NOME ou release/NOME')
  console.error('O nome da tarefa deve ser o PPM do Jira.\n')
  process.exit(1)
}
