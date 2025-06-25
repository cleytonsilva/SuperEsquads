# ESQUADS - Sistema de Gestão de Esquadrões

Sistema completo de gestão de esquadrões com dashboard administrativo, autenticação via Supabase e testes automatizados.

## Estrutura do Projeto

- `esquads-dashboard/` - Frontend Next.js 14 com App Router
- `supabase/` - Backend com Edge Functions e configurações
- `tests/` - Testes unitários, integração e E2E
- `docs/` - Documentação completa do projeto

## Tecnologias

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Supabase, Edge Functions (Deno)
- **Testes:** Jest, Playwright, E2E customizado
- **Deploy:** Vercel + Supabase

## Como Executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar testes
npm run test
```

## Status

✅ Dashboard funcional
✅ Autenticação implementada
✅ Testes E2E configurados
✅ Documentação atualizada