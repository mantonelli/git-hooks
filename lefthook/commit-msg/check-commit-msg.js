const { readFileSync } = require('fs')

const msgFile = process.argv[2]
const msg = readFileSync(msgFile, 'utf8').trim()

if (msg.startsWith('Merge ') || msg.startsWith('Revert ')) process.exit(0)

const PATTERN = /^(feat|fix|chore|docs|refactor|test|ci|perf|style|revert)(\(.+\))?: .+/

if (!PATTERN.test(msg)) {
  console.error('\n[hook] Mensagem de commit inválida.')
  console.error('Formato: tipo(escopo-opcional): descrição')
  console.error('Tipos válidos: feat, fix, chore, docs, refactor, test, ci, perf, style, revert')
  console.error(`Recebido: "${msg}"\n`)
  process.exit(1)
}
