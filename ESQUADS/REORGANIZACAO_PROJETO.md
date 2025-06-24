# Reorganização do Projeto ESQUADS

## Objetivo

Este documento descreve a reorganização estrutural do projeto ESQUADS para melhorar a manutenibilidade, escalabilidade e organização do código.

## Estrutura Atual vs. Nova Estrutura

### Estrutura Atual
```
ESQUADS/
├── esquads-dashboard/
├── esquads-landing-login/
├── docs-consolidada/
└── reciclar/
```

### Nova Estrutura Proposta
```
ESQUADS/
├── apps/
│   ├── dashboard/          # Aplicação principal
│   ├── landing/           # Landing page
│   └── admin/             # Painel administrativo
├── packages/
│   ├── ui/                # Componentes compartilhados
│   ├── config/            # Configurações
│   ├── types/             # Tipos TypeScript
│   └── utils/             # Utilitários
├── docs/
│   ├── api/               # Documentação da API
│   ├── components/        # Documentação de componentes
│   └── guides/            # Guias de desenvolvimento
├── tools/
│   ├── scripts/           # Scripts de automação
│   ├── configs/           # Configurações de ferramentas
│   └── templates/         # Templates de código
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

## Plano de Migração

### Fase 1: Preparação (1 semana)
- [ ] Backup completo do projeto atual
- [ ] Criação da nova estrutura de diretórios
- [ ] Configuração do monorepo com Turborepo/Nx

### Fase 2: Migração de Aplicações (2 semanas)
- [ ] Migrar esquads-dashboard para apps/dashboard
- [ ] Migrar esquads-landing-login para apps/landing
- [ ] Atualizar imports e referências

### Fase 3: Extração de Packages (2 semanas)
- [ ] Extrair componentes UI compartilhados
- [ ] Criar package de tipos TypeScript
- [ ] Centralizar utilitários comuns

### Fase 4: Documentação e Ferramentas (1 semana)
- [ ] Reorganizar documentação
- [ ] Configurar scripts de build
- [ ] Atualizar CI/CD

## Benefícios da Reorganização

### 1. Manutenibilidade
- Código mais organizado e fácil de encontrar
- Separação clara de responsabilidades
- Redução de duplicação de código

### 2. Escalabilidade
- Estrutura preparada para novos apps
- Packages reutilizáveis
- Build otimizado com cache

### 3. Colaboração
- Estrutura familiar para desenvolvedores
- Documentação centralizada
- Padrões consistentes

### 4. Performance
- Build incremental
- Tree shaking otimizado
- Bundles menores

## Configuração do Monorepo

### package.json (raiz)
```json
{
  "name": "esquads-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Packages Compartilhados

### @esquads/ui
- Componentes React reutilizáveis
- Design system
- Temas e estilos

### @esquads/config
- Configurações ESLint
- Configurações TypeScript
- Configurações Tailwind

### @esquads/types
- Tipos TypeScript compartilhados
- Interfaces de API
- Tipos de dados

### @esquads/utils
- Funções utilitárias
- Helpers de validação
- Formatadores

## Migração de Dependências

### Dependências Compartilhadas
- React, Next.js, TypeScript
- Tailwind CSS, Radix UI
- Zod, React Hook Form

### Dependências Específicas
- Cada app mantém suas dependências únicas
- Packages têm dependências mínimas

## Scripts de Automação

### Criação de Novos Apps
```bash
npm run create:app <nome>
```

### Criação de Novos Packages
```bash
npm run create:package <nome>
```

### Build Completo
```bash
npm run build:all
```

### Testes Completos
```bash
npm run test:all
```

## Cronograma de Implementação

| Semana | Atividades | Responsável |
|--------|------------|-------------|
| 1 | Preparação e configuração | Dev Team |
| 2-3 | Migração de aplicações | Dev Team |
| 4-5 | Extração de packages | Dev Team |
| 6 | Documentação e testes | Dev Team |

## Riscos e Mitigações

### Riscos Identificados
1. **Quebra de funcionalidades** durante migração
2. **Conflitos de dependências** entre packages
3. **Complexidade adicional** inicial

### Mitigações
1. **Testes automatizados** em cada etapa
2. **Versionamento semântico** rigoroso
3. **Documentação detalhada** do processo

## Conclusão

A reorganização do projeto ESQUADS em uma estrutura de monorepo trará benefícios significativos em termos de manutenibilidade, escalabilidade e colaboração. O plano de migração gradual minimiza riscos e garante continuidade do desenvolvimento.

### Próximos Passos
1. Aprovação da proposta pela equipe
2. Início da Fase 1 de preparação
3. Execução do plano de migração
4. Monitoramento e ajustes conforme necessário
