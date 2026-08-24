# Jira SLA Monitor API

API de autorização da extensão Jira SLA Monitor.

## Versão

**1.1.0**

## Estrutura

```text
api/
  auth.js
  health.js
data/
  users.json
package.json
vercel.json
```

## Autenticação

A rota de autenticação agora usa **usuário + senha** via `POST`.

Endpoint:

```text
POST /api/auth
Content-Type: application/json
```

Corpo de exemplo:

```json
{
  "username": "rafael.admin",
  "password": "Agosto@2026"
}
```

Resposta esperada:

```json
{
  "authorized": true,
  "user": {
    "username": "rafael.admin",
    "name": "Rafael",
    "role": "admin"
  }
}
```

Os usuários de demonstração são:

- `rafael.admin` — perfil `admin`
- `jean` — perfil `user`

A senha de demonstração usada para ambos é `Agosto@2026`.

## Segurança

As senhas **não ficam salvas em texto puro** no `users.json`.
A API usa `scrypt` com salt individual para validar as credenciais.

Mesmo assim, para uso real:

- mantenha o repositório privado;
- troque as credenciais de demonstração;
- não coloque tokens, chaves ou segredos no repositório;
- use Environment Variables da Vercel para segredos reais.

## Bloqueio remoto

Para bloquear um usuário, altere no `data/users.json`:

```json
"active": true
```

para:

```json
"active": false
```

Depois faça commit no GitHub. A Vercel fará um novo deploy e a API passará a responder `user_disabled`.

## Health check

```text
GET /api/health
```

Resposta:

```json
{
  "status": "online",
  "project": "Jira SLA Monitor API",
  "version": "1.1.0"
}
```
