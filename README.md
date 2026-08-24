# Jira SLA Monitor API

API de autorização para o projeto Jira SLA Monitor.

## Versão

**1.2.0**

## Novidade desta versão

Foi adicionada uma página de teste para validar a autenticação antes da integração com a extensão:

```text
/test
```

## Estrutura

```text
api/
  auth.js
  health.js
data/
  users.json
public/
  test.html
package.json
README.md
vercel.json
```

## Teste rápido

Health check:

```text
GET /api/health
```

Página de autenticação:

```text
/test
```

Credenciais de demonstração:

- `rafael.admin` / `Agosto@2026`
- `jean` / `Agosto@2026`

## Bloqueio remoto

Para bloquear um usuário, altere no `data/users.json`:

```json
"active": true
```

para:

```json
"active": false
```

Depois faça commit no GitHub. A Vercel fará um novo deploy.

## Segurança

As senhas não ficam em texto puro no `users.json`; são validadas com `scrypt` e salt individual.

Mesmo assim, em produção:
- mantenha o repositório privado;
- troque as credenciais de demonstração;
- não coloque tokens, chaves ou segredos no repositório;
- use Environment Variables da Vercel para segredos reais.
