const { execSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')

const msgFile = process.argv[2]
const source = process.argv[3]

if (['message', 'merge', 'squash', 'commit'].includes(source)) process.exit(0)

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
const PROTECTED = ['main', 'devel', 'homol']
if (PROTECTED.includes(branch)) process.exit(0)

const match = branch.match(/^(feat|fix|chore)\/(.+)/)
if (!match) process.exit(0)

const [, type, ticket] = match
const existing = readFileSync(msgFile, 'utf8')

const hasContent = existing.split('\n').some(l => l.trim() && !l.startsWith('#'))
if (hasContent) process.exit(0)

writeFileSync(msgFile, `${type}: \n\n# Ticket: ${ticket}\n` + existing)
