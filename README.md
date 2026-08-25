# SLA Pulse API

## v1.4.0 — Administração de usuários

Novo endpoint protegido:

`/api/admin/users`

Métodos:
- GET: listar usuários
- POST: criar usuário
- PATCH: editar, ativar/desativar, trocar perfil ou redefinir senha
- DELETE: excluir usuário

A API exige token de sessão e confirma no servidor que o usuário atual está ativo e possui `role: admin`.

### Proteções
- usuário comum não administra usuários;
- admin não pode excluir a própria conta;
- admin não pode desativar a própria conta;
- admin não pode remover seu próprio perfil;
- último admin ativo é protegido;
- senhas continuam em scrypt + salt.

### Variáveis Vercel necessárias

Já existente:
`SESSION_SECRET`

Adicionar:
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

Para este projeto:
- `GITHUB_OWNER=InfoPrimetec`
- `GITHUB_REPO=jira-sla-monitor-api`
- `GITHUB_BRANCH=main`

O `GITHUB_TOKEN` deve ter o menor privilégio possível e acesso somente a este repositório, com `Contents: Read and write`.

Nunca coloque o token no GitHub ou na extensão.

### Privacidade
A API permanece restrita a identidade e autorização. Nenhum dado operacional do Jira deve ser enviado a esses endpoints.
