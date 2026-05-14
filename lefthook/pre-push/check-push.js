const { execSync } = require('child_process')
const readline = require('readline')

const PROTECTED = ['main', 'devel', 'homol']
const FORCE_PUSH_BLOCKED = ['main', 'devel']
const REQUIRE_MERGE_COMMIT = ['homol', 'devel']
const TASK_PATTERN = /^(feat|fix|chore)\/.+/
const RELEASE_PATTERN = /^release\/.+/
const NULL_SHA = '0000000000000000000000000000000000000000'

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
const rl = readline.createInterface({ input: process.stdin })
let failed = false

function isAncestor(ancestor, descendant) {
  try {
    execSync(`git merge-base --is-ancestor ${ancestor} ${descendant}`, { stdio: 'ignore' })
    return true
  } catch (_) {
    return false
  }
}

function isMergeCommit(sha) {
  try {
    const parents = execSync(`git cat-file -p ${sha}`, { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .split('\n')
      .filter(l => l.startsWith('parent'))
    return parents.length >= 2
  } catch (_) {
    return false
  }
}

rl.on('line', (line) => {
  if (failed) return
  const parts = line.trim().split(' ')
  if (parts.length < 4) return

  const [, localSha, remoteRef, remoteSha] = parts
  const remoteBranch = remoteRef.replace('refs/heads/', '')
  const isFirstPush = remoteSha === NULL_SHA
  const isForcePush = !isFirstPush && !isAncestor(remoteSha, localSha)

  if (PROTECTED.includes(remoteBranch) && !PROTECTED.includes(currentBranch)) {
    console.error(`\n[hook] Não é permitido fazer push para "${remoteBranch}" a partir de "${currentBranch}".`)
    console.error(`Fluxo correto: git checkout ${remoteBranch} && git merge --no-ff ${currentBranch} && git push\n`)
    failed = true
    return
  }

  if (FORCE_PUSH_BLOCKED.includes(remoteBranch) && isForcePush) {
    console.error(`\n[hook] Force push em "${remoteBranch}" é proibido.`)
    console.error('Branches de código compartilhado e produção não podem ter histórico reescrito.\n')
    failed = true
    return
  }

  if (REQUIRE_MERGE_COMMIT.includes(remoteBranch) && !isFirstPush && !isForcePush) {
    if (!isMergeCommit(localSha)) {
      console.error(`\n[hook] O commit no topo de "${remoteBranch}" não é um merge commit.`)
      console.error(`Use --no-ff ao integrar: git merge --no-ff <branch-de-tarefa>\n`)
      failed = true
    }
  }
})

rl.on('close', () => {
  if (failed) process.exit(1)

  if (!PROTECTED.includes(currentBranch) && !TASK_PATTERN.test(currentBranch) && !RELEASE_PATTERN.test(currentBranch)) {
    console.error(`\n[hook] Nome de branch inválido: "${currentBranch}"`)
    console.error('Use: feat/NOME, fix/NOME, chore/NOME ou release/NOME\n')
    process.exit(1)
  }

  process.exit(0)
})
