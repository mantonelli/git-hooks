# git-hooks

Hooks Git centralizados para padronizar o fluxo de trabalho entre repositórios. Gerenciados via [lefthook](https://github.com/evilmartians/lefthook) — binário único, sem dependência de runtime de shell, compatível com Linux, macOS e Windows.

## Requisitos

- [lefthook](https://github.com/evilmartians/lefthook#installation) instalado na máquina do desenvolvedor
- [Node.js](https://nodejs.org) instalado (usado para executar os scripts dos hooks)

## Integração em um projeto

Adicione um `lefthook.yml` na raiz do repositório consumidor referenciando este repositório:

```yaml
remotes:
  - git_url: https://github.com/org/git-hooks
    ref: main
    configs:
      - lefthook.yml
```

Depois, cada desenvolvedor executa uma única vez após clonar o projeto:

```sh
lefthook install
```

Para atualizar os hooks quando este repositório central for alterado:

```sh
lefthook install
```

## Hooks

### `pre-commit` — Validação de nome de branch

Executado antes de cada commit. Garante que o desenvolvedor está trabalhando em uma branch de tarefa válida e não diretamente nas branches protegidas.

**Bloqueia** commits diretos em `main`, `devel` e `homol` (commits de merge são permitidos, pois fazem parte do fluxo de integração).

**Bloqueia** commits em branches com nome fora do padrão. O nome deve seguir:

```
feat/NOME-DA-TAREFA   → nova funcionalidade ou processo
fix/NOME-DA-TAREFA    → correção de funcionalidade existente
chore/NOME-DA-TAREFA  → documentação ou refatoração
```

O `NOME-DA-TAREFA` deve ser o PPM do Jira.

---

### `commit-msg` — Validação de mensagem de commit

Executado após o desenvolvedor escrever a mensagem de commit. Garante que as mensagens seguem o padrão [Conventional Commits](https://www.conventionalcommits.org), o que viabiliza geração automática de changelogs e rastreabilidade.

**Formato esperado:**

```
tipo(escopo-opcional): descrição
```

**Tipos válidos para commits:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `style`, `revert`

**Exemplos válidos:**
```
feat: adiciona tela de login
fix(auth): corrige expiração de token
chore(deps): atualiza dependências
```

Commits de merge (`Merge ...`) e revert (`Revert ...`) são ignorados automaticamente.

---

### `post-checkout` — Validação de base da branch

Executado após `git checkout -b` ou `git switch -c`. Como o Git não oferece um hook anterior à criação de branches, este hook não pode impedir a criação, mas **avisa imediatamente** quando a base está errada e exibe os comandos para corrigir.

Regras por tipo de branch:

| Tipo | Base obrigatória | Base proibida |
|------|-----------------|---------------|
| `feat/`, `fix/`, `chore/` | `devel` | `main`, `homol` |
| `release/` | `main` | qualquer outra |

---

### `pre-push` — Validação de fluxo de push

Executado antes de cada `git push`. Realiza três verificações:

**1. Bloqueia push direto para branches protegidas a partir de branches de tarefa.** O fluxo correto é fazer checkout da branch protegida, executar o merge e depois o push:

```sh
git checkout homol
git pull origin homol
git merge --no-ff feat/NOME-DA-TAREFA
git push origin homol
```

**2. Bloqueia force push em `main` e `devel`.** Branches de código compartilhado e produção não podem ter histórico reescrito. Force push em `homol` é permitido, pois o fluxo prevê reset periódico do ambiente de homologação.

**3. Bloqueia push em `homol` e `devel` quando o commit do topo não é um merge commit.** Garante que `--no-ff` foi usado na integração, preservando o histórico das branches de tarefa.

**Bloqueia** push de branches com nome fora do padrão `feat/`, `fix/`, `chore/` ou `release/`.

---

### `prepare-commit-msg` — Template de mensagem de commit

Executado antes de abrir o editor de commit. Pré-preenche a mensagem com o tipo correto extraído do nome da branch, reduzindo erros de formato.

Para uma branch `feat/PPM-1234`, o editor abrirá com:

```
feat: 
# Ticket: PPM-1234
```

O desenvolvedor precisa apenas completar a descrição após `feat: `. Só atua em commits interativos — commits com `-m`, merges, squashes e amends não são afetados. Branches `release/` não recebem template pois `release` não é um tipo válido em Conventional Commits.

## Branches protegidas

| Branch     | Finalidade                                          |
|------------|-----------------------------------------------------|
| `main`     | Código em produção                                  |
| `homol`    | Código em processo de homologação (efêmero)         |
| `devel`    | Código homologado, compartilhado entre a equipe     |
| `release/` | Preparação de release — criada obrigatoriamente a partir de `main` |

Nunca trabalhe diretamente em `main`, `devel` ou `homol`. Cada tarefa deve ter sua própria branch isolada criada a partir de `devel`. Branches `release/` são a exceção: partem de `main`.

## Fluxo resumido

```sh
# Iniciar tarefa
git checkout devel && git pull origin devel
git checkout -b feat/NOME-DA-TAREFA

# Enviar para homologação
git checkout homol && git pull origin homol
git merge --no-ff feat/NOME-DA-TAREFA
git push origin homol

# Após homologação: compartilhar com a equipe
git checkout devel && git pull origin devel
git merge --no-ff feat/NOME-DA-TAREFA
git push origin devel

# Após aprovação para produção
git checkout main && git pull origin main
git merge feat/NOME-DA-TAREFA
git push origin main

# Limpeza
git branch -d feat/NOME-DA-TAREFA
git push origin --delete feat/NOME-DA-TAREFA
git fetch --prune
```
