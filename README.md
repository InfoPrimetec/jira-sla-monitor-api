# SLA Pulse API

API de autenticação e controle de acesso do SLA Pulse.

## Versão 1.3.0

Esta versão inicia a fase de segurança da v3.1.6 da extensão.

### Novidades

- login por usuário e senha;
- token de sessão assinado com HMAC-SHA256;
- sessão com expiração;
- endpoint `GET /api/me`;
- revalidação do usuário no `users.json` a cada consulta de sessão;
- bloqueio remoto continua funcionando mesmo com um token ainda válido;
- perfil (`admin` / `user`) é lido novamente no servidor;
- nenhuma senha ou segredo de sessão é incluído no código da extensão.

## Variável obrigatória na Vercel

Antes de testar a v1.3.0, crie:

```text
SESSION_SECRET
```

Ela deve ter pelo menos 32 caracteres e deve ser um valor aleatório forte.

Exemplo de nome no painel:

```text
Settings
→ Environment Variables
→ SESSION_SECRET
```

**Não coloque o valor dessa variável no GitHub, README ou extensão.**

Opcionalmente:

```text
SESSION_TTL_MINUTES
```

Faixa aceita: 15 a 1440 minutos. Se não for configurada, a sessão dura 480 minutos (8 horas).

Depois de criar/alterar Environment Variables, faça um novo deployment na Vercel.

## Endpoints

### Health

```text
GET /api/health
```

### Login

```text
POST /api/auth
Content-Type: application/json
```

Corpo:

```json
{
  "username": "rafael.admin",
  "password": "senha"
}
```

Resposta bem-sucedida:

```json
{
  "authorized": true,
  "token": "...",
  "expiresAt": "...",
  "user": {
    "username": "rafael.admin",
    "name": "Rafael",
    "role": "admin"
  }
}
```

### Validar sessão

```text
GET /api/me
Authorization: Bearer TOKEN
```

A API valida a assinatura/expiração do token e consulta novamente o cadastro atual do usuário.

Se o usuário tiver sido desativado depois do login, `/api/me` responde:

```json
{
  "authorized": false,
  "reason": "user_disabled"
}
```

## Teste visual

```text
/test
```

A página permite:

1. fazer login;
2. armazenar o token apenas na sessão da aba;
3. testar `/api/me`.

## Arquitetura de privacidade

Esta API é destinada exclusivamente a identidade, autenticação e autorização.

Dados operacionais do Jira/SLA Pulse não devem ser enviados para estes endpoints.
