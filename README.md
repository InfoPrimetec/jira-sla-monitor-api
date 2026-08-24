# Jira SLA Monitor API

API de autorização para o projeto Jira SLA Monitor.

## Estrutura

- `api/health.js`: verifica se a API está online.
- `api/auth.js`: valida se um e-mail está autorizado.
- `data/users.json`: lista de usuários autorizados.

## Testes após o deploy

### Health check

`/api/health`

Resposta esperada:

```json
{
  "status": "online",
  "project": "Jira SLA Monitor API",
  "version": "1.0.0"
}
```

### Autorização

`/api/auth?email=tecnico1@empresa.com`

Usuário ativo:

```json
{
  "authorized": true,
  "user": {
    "id": 1,
    "name": "Técnico 1",
    "email": "tecnico1@empresa.com"
  }
}
```

Usuário inexistente ou inativo retorna `authorized: false`.

## Importante

Mantenha o repositório privado e não armazene senhas, tokens ou chaves em `users.json`.
