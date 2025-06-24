# Esquads Supabase Backend

Este diretório contém toda a infraestrutura de backend da plataforma Esquads, incluindo Edge Functions, migrações de banco de dados e políticas de segurança.

## 📁 Estrutura do Projeto

```
supabase/
├── config.toml                 # Configuração do projeto Supabase
├── functions/                  # Edge Functions
│   ├── _shared/               # Utilitários compartilhados
│   │   ├── auth.ts           # Autenticação e autorização
│   │   ├── cors.ts           # Headers CORS
│   │   ├── errors.ts         # Classes de erro customizadas
│   │   ├── llm.ts            # Integração com APIs de IA
│   │   ├── pdf.ts            # Geração de PDFs
│   │   └── validation.ts     # Validação de dados
│   ├── course-generator/      # Função de geração de cursos
│   │   └── index.ts
│   └── certificate-generator/ # Função de geração de certificados
│       └── index.ts
├── migrations/                # Migrações SQL
│   └── 20240101000000_rls_policies.sql
└── README.md                  # Esta documentação
```

## 🚀 Edge Functions

### 1. course-generator

**Endpoint:** `POST /functions/v1/course-generator`

**Descrição:** Gera cursos completos usando IA de forma assíncrona.

**Autenticação:** Requer token JWT e permissões de administrador.

**Parâmetros:**
```json
{
  "topic": "Introdução à Cibersegurança",
  "audience": "Estudantes de TI",
  "moduleCount": 4
}
```

**Resposta de Sucesso:**
```json
{
  "jobId": "course-gen-1234567890",
  "status": "started",
  "message": "Geração de curso iniciada com sucesso",
  "courseId": "uuid-do-curso",
  "estimatedTime": "5-10 minutos"
}
```

**Fluxo de Execução:**
1. Validação de permissões (apenas admins)
2. Validação dos dados de entrada
3. Geração da estrutura do curso via LLM
4. Criação do curso no banco (status: 'generating')
5. Geração assíncrona do conteúdo das lições
6. Geração de questionários para cada módulo
7. Atualização do status para 'published'

### 2. certificate-generator

**Endpoint:** `POST /functions/v1/certificate-generator`

**Descrição:** Gera certificados em PDF para alunos que concluíram cursos.

**Autenticação:** Requer token JWT (proprietário da matrícula ou admin).

**Parâmetros:**
```json
{
  "enrollmentId": "uuid-da-matricula"
}
```

**Resposta de Sucesso:**
- Content-Type: `application/pdf`
- Arquivo PDF do certificado

**Fluxo de Execução:**
1. Validação de propriedade ou permissões de admin
2. Verificação se o curso foi concluído
3. Busca de dados do aluno e curso
4. Geração do PDF do certificado
5. Armazenamento no Supabase Storage (opcional)
6. Retorno do arquivo PDF

## 🔒 Políticas de Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado com as seguintes políticas:

### Tabela `profiles`
- **SELECT:** Usuários podem ler apenas seu próprio perfil
- **UPDATE:** Usuários podem atualizar apenas seu próprio perfil
- **INSERT:** Usuários podem criar seu próprio perfil

### Tabela `courses`
- **SELECT:** Usuários autenticados podem ler cursos publicados; Admins podem ler todos
- **INSERT/UPDATE:** Apenas administradores

### Tabela `modules` e `lessons`
- **SELECT:** Usuários autenticados podem ler conteúdo de cursos publicados; Admins podem ler tudo
- **INSERT/UPDATE:** Apenas administradores

### Tabela `enrollments`
- **SELECT:** Usuários veem apenas suas matrículas; Admins veem todas
- **INSERT:** Usuários podem se matricular em cursos publicados
- **UPDATE:** Usuários podem atualizar suas matrículas; Admins podem atualizar qualquer uma

### Tabela `progress`
- **SELECT:** Usuários veem apenas seu progresso; Admins veem todo progresso
- **INSERT/UPDATE:** Usuários podem gerenciar apenas seu próprio progresso

### Tabela `certificates`
- **SELECT:** Usuários veem apenas seus certificados; Admins veem todos
- **INSERT:** Sistema (via Edge Functions) ou administradores

## 🛠️ Configuração e Deploy

### Pré-requisitos

1. **Supabase CLI** instalado
2. **Deno** instalado (para Edge Functions)
3. **Chaves de API** configuradas:
   - `OPENAI_API_KEY` nos segredos do Supabase

### Comandos de Deploy

```bash
# Fazer login no Supabase
supabase login

# Linkar com o projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrações
supabase db push

# Deploy das Edge Functions
supabase functions deploy course-generator
supabase functions deploy certificate-generator

# Configurar segredos
supabase secrets set OPENAI_API_KEY=sua_chave_aqui
```

### Variáveis de Ambiente

Configure os seguintes segredos no Supabase:

```bash
# Chave da API OpenAI para geração de conteúdo
OPENAI_API_KEY=sk-...

# Configurações opcionais
OPENAI_MODEL=gpt-4  # Modelo padrão: gpt-4
OPENAI_MAX_TOKENS=4000  # Tokens máximos por requisição
```

## 📊 Monitoramento e Logs

### Logs das Edge Functions

```bash
# Ver logs em tempo real
supabase functions logs course-generator
supabase functions logs certificate-generator

# Ver logs específicos
supabase functions logs course-generator --filter="ERROR"
```

### Métricas Importantes

- **Taxa de sucesso** na geração de cursos
- **Tempo médio** de geração de conteúdo
- **Uso de tokens** da API OpenAI
- **Erros de validação** mais comuns

## 🧪 Testes

### Testando course-generator

```bash
curl -X POST 'https://SEU_PROJECT.supabase.co/functions/v1/course-generator' \
  -H 'Authorization: Bearer SEU_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "topic": "Introdução ao JavaScript",
    "audience": "Iniciantes em programação",
    "moduleCount": 3
  }'
```

### Testando certificate-generator

```bash
curl -X POST 'https://SEU_PROJECT.supabase.co/functions/v1/certificate-generator' \
  -H 'Authorization: Bearer SEU_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "enrollmentId": "uuid-da-matricula"
  }' \
  --output certificado.pdf
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro 403 - Forbidden**
   - Verificar se o usuário tem permissões de admin (course-generator)
   - Verificar se o usuário é proprietário da matrícula (certificate-generator)

2. **Erro 500 - OpenAI API**
   - Verificar se `OPENAI_API_KEY` está configurada
   - Verificar se há créditos suficientes na conta OpenAI
   - Verificar rate limits da API

3. **Timeout na geração de curso**
   - Reduzir o número de módulos
   - Verificar logs para identificar onde parou
   - Considerar implementar retry logic

4. **Erro na geração de PDF**
   - Verificar se todos os dados necessários estão presentes
   - Verificar logs para erros específicos do pdf-lib

### Logs de Debug

Todos os erros são logados com contexto estruturado:

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "error",
  "function": "course-generator",
  "error": {
    "name": "ExternalServiceError",
    "message": "OpenAI API error: 429 - Rate limit exceeded",
    "service": "OpenAI"
  },
  "userId": "uuid-do-usuario",
  "requestId": "req-123456"
}
```

## 📚 Recursos Adicionais

- [Documentação do Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação do Deno](https://deno.land/manual)
- [API Reference OpenAI](https://platform.openai.com/docs/api-reference)
- [pdf-lib Documentation](https://pdf-lib.js.org/)

## 🤝 Contribuição

Para contribuir com o backend:

1. Siga os padrões de código estabelecidos
2. Adicione testes para novas funcionalidades
3. Documente mudanças nas políticas de RLS
4. Teste localmente antes do deploy

```bash
# Desenvolvimento local
supabase start
supabase functions serve course-generator --no-verify-jwt
```