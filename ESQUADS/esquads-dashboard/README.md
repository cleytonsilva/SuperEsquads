# ESQUADS Dashboard

## Visão Geral
Dashboard principal do sistema ESQUADS para gestão de esquadrões de segurança cibernética.

## Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **Backend:** Supabase
- **Autenticação:** Supabase Auth
- **Validação:** Zod + React Hook Form
- **Testes:** Jest + Playwright
- **Deploy:** Vercel

## Estrutura do Projeto

```
/app                 # Next.js 14 App Router
  /api              # API Routes
  /globals.css      # Estilos globais
  /layout.tsx       # Layout raiz
  /page.tsx         # Página inicial
/components          # Componentes React reutilizáveis
  /ui               # Componentes base do design system
  /forms            # Componentes de formulário
  /layout           # Componentes de layout
/lib                 # Utilitários e configurações
  /validations      # Schemas Zod
  /repositories     # Padrão Repository
  /errors.ts        # Classes de erro customizadas
  /utils.ts         # Utilitários gerais
/types               # Definições TypeScript
/hooks               # Custom hooks
/middleware.ts       # Middleware Next.js
/constants           # Constantes da aplicação
/contexts            # React Contexts
```

## Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   # Edite .env.local com suas configurações
   ```

3. **Executar em desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Executar testes:**
   ```bash
   npm run test
   npm run test:e2e
   ```

5. **Build para produção:**
   ```bash
   npm run build
   npm run start
   ```

## Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Testes unitários
- `npm run test:e2e` - Testes end-to-end
- `npm run lint` - Verificação de código
- `npm run type-check` - Verificação TypeScript
- `npm run validate` - Pipeline completa de validação

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente
3. Execute as migrations: `npm run db:push`
4. Gere os tipos: `npm run db:generate-types`

## Deploy

O projeto está configurado para deploy automático no Vercel:

- **Staging:** `npm run deploy:staging`
- **Produção:** `npm run deploy:production`

## Padrões de Código

- **TypeScript estrito** com zero tolerância a erros
- **ESLint + Prettier** para formatação
- **Testes obrigatórios** para novas funcionalidades
- **Commits semânticos** seguindo Conventional Commits

## Contribuição

Antes de contribuir, execute:

```bash
npm run validate
```

Este comando executa:
- Type checking
- Linting
- Formatação
- Testes unitários

## Suporte

Para dúvidas ou problemas, consulte a documentação em `/docs` ou abra uma issue.