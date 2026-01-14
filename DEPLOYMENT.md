# Guia de Hospedagem: Vertex App 🚀

Este guia explica como colocar a aplicação Vertex online usando serviços modernos e gratuitos/económicos.

## 1. Preparação (Importante)

Antes de começar, certifique-se de que subiu todo o código para um repositório no **GitHub**.

---

## 2. Hospedagem do Backend (FastAPI)

Recomendamos o **[Railway.app](https://railway.app/)** ou o **[Render](https://render.com/)**.

### No Railway

1. Conecte o seu GitHub e escolha a pasta `backend` (ou o repositório inteiro se for um monorepo).
2. O Railway detetará o `Dockerfile` e iniciará o build automaticamente.
3. **Variáveis de Ambiente**: No painel do Railway, adicione as variáveis do ficheiro `.env`:
   - `DATABASE_URL`: A sua URL do Supabase (com a nova password).
   - `ALLOWED_ORIGINS`: O URL final do seu frontend (ex: `https://seu-app.vercel.app`).
4. O Railway fornecerá um URL (ex: `https://backend-production.up.railway.app`). **Copie este URL.**

---

## 3. Hospedagem do Frontend (Next.js)

Recomendamos o **[Vercel](https://vercel.com/)**.

### Na Vercel

1. Importe o seu repositório do GitHub.
2. Nas configurações de Build:
   - **Root Directory**: `frontend`.
   - **Framework Preset**: Next.js.
3. **Variáveis de Ambiente**: Adicione a seguinte variável:
   - `NEXT_PUBLIC_API_BASE`: O URL do backend que copiou do Railway + `/api/v1` (ex: `https://backend-production.up.railway.app/api/v1`).
4. Clique em **Deploy**.

---

## 4. Ligação Final (CORS)

Para que o Frontend possa falar com o Backend, volte ao Backend (Railway) e certifique-se de que o `ALLOWED_ORIGINS` inclui o URL que a Vercel lhe deu.

Exemplo de `ALLOWED_ORIGINS` no Railway:
`https://seu-app.vercel.app,http://localhost:3000`

---

## 5. Base de Dados (Supabase)

Como já fizemos a migração, não precisa de mudar nada no Supabase. O Backend online ligar-se-á à mesma base de dados que usamos localmente.

### Notas de Segurança

- Nunca partilhe o seu ficheiro `.env` publicamente.
- Use as "Environment Variables" nos painéis de controle dos serviços (Vercel/Railway) para manter os segredos seguros.

A sua app estará agora disponível para qualquer pessoa através do URL da Vercel! 🎉
