# 🚀 ESQUADS - Visão Geral do Projeto

## 📋 Sobre o Projeto

O **ESQUADS** é um sistema completo de gestão de esquadrões educacionais com gamificação e inteligência artificial. O projeto combina tecnologias modernas para criar uma plataforma robusta de aprendizado colaborativo.

## 🏗️ Arquitetura

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + Radix UI
- **Estado:** React Context + Hooks
- **Autenticação:** Supabase Auth

### Backend
- **Plataforma:** Supabase
- **Edge Functions:** Deno Runtime
- **Banco de Dados:** PostgreSQL
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

### Testes
- **Unitários:** Jest + Testing Library
- **E2E:** Playwright + Custom Runner
- **Integração:** Custom Test Suite
- **Performance:** Lighthouse CI

## 📁 Estrutura do Projeto

```
ESQUADS/
├── esquads-dashboard/          # Frontend Next.js
│   ├── app/                   # App Router (Next.js 14)
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilitários e configurações
│   ├── types/                 # Definições TypeScript
│   └── public/                # Assets estáticos
├── supabase/                  # Backend Supabase
│   ├── functions/             # Edge Functions (Deno)
│   ├── migrations/            # Migrações do banco
│   └── config.toml           # Configurações Supabase
├── tests/                     # Suíte de testes
│   ├── e2e/                  # Testes End-to-End
│   ├── integration/          # Testes de integração
│   └── unit/                 # Testes unitários
├── docs/                      # Documentação
├── config/                    # Configurações do projeto
└── scripts/                   # Scripts de automação
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm 8+
- Supabase CLI
- Git

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/cleytonsilva/SuperEsquads.git
cd SuperEsquads/ESQUADS

# Instalar dependências
npm run setup

# Configurar Supabase local
cd supabase
supabase start
cd ..

# Executar em desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Iniciar servidor de produção

# Testes
npm run test             # Executar todos os testes
npm run test:e2e         # Testes E2E
npm run test:unit        # Testes unitários
npm run test:integration # Testes de integração

# Qualidade
npm run lint             # Verificar ESLint
npm run type-check       # Verificar TypeScript
npm run validate         # Pipeline completa de validação

# Banco de Dados
npm run db:generate-types # Gerar tipos TypeScript
npm run db:reset         # Reset do banco local
npm run db:push          # Aplicar migrações
```

## 🧪 Testes

### Estratégia de Testes

1. **Testes Unitários** - Componentes e funções isoladas
2. **Testes de Integração** - APIs e fluxos de dados
3. **Testes E2E** - Jornadas completas do usuário
4. **Testes de Performance** - Métricas de velocidade
5. **Testes de Acessibilidade** - Conformidade WCAG

### Executar Testes

```bash
# Todos os testes
npm run test

# Testes específicos
npm run test:e2e:auth      # Testes de autenticação
npm run test:e2e:ai        # Testes de IA
npm run test:e2e:payments  # Testes de pagamento
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` no diretório `esquads-dashboard/`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (opcional)
OPENAI_API_KEY=your_openai_key

# Google AI (opcional)
GOOGLE_AI_API_KEY=your_google_ai_key
```

## 📊 Monitoramento

### Métricas de Qualidade

- **Cobertura de Testes:** > 80%
- **Performance:** < 3s First Contentful Paint
- **Acessibilidade:** Score > 90
- **SEO:** Score > 90
- **TypeScript:** Zero erros

### Relatórios

- **E2E Tests:** `E2E_TEST_REPORT.md`
- **Coverage:** `coverage/lcov-report/index.html`
- **Bundle Analysis:** `npm run bundle:analyze`

## 🚀 Deploy

### Staging
```bash
npm run deploy:staging
```

### Produção
```bash
npm run deploy:production
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Commit

```
feat: adicionar nova funcionalidade
fix: corrigir bug
docs: atualizar documentação
style: formatação de código
refactor: refatoração
test: adicionar testes
chore: tarefas de manutenção
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/cleytonsilva/SuperEsquads/issues)
- **Documentação:** `/docs/`
- **Wiki:** [GitHub Wiki](https://github.com/cleytonsilva/SuperEsquads/wiki)

---

**Desenvolvido com ❤️ pela equipe ESQUADS**