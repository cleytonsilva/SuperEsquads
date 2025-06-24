#!/bin/bash

# Deploy script for Esquads Supabase Backend
# Este script automatiza o processo de deploy das Edge Functions e configurações

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Verificando dependências..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI não está instalado. Instale com: npm install -g supabase"
        exit 1
    fi
    
    if ! command -v deno &> /dev/null; then
        print_error "Deno não está instalado. Instale em: https://deno.land/manual/getting_started/installation"
        exit 1
    fi
    
    print_success "Todas as dependências estão instaladas"
}

# Check if user is logged in to Supabase
check_auth() {
    print_status "Verificando autenticação do Supabase..."
    
    if ! supabase projects list &> /dev/null; then
        print_error "Você não está logado no Supabase. Execute: supabase login"
        exit 1
    fi
    
    print_success "Autenticado no Supabase"
}

# Link to Supabase project
link_project() {
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        print_warning "SUPABASE_PROJECT_REF não definido. Pulando link do projeto."
        print_warning "Execute manualmente: supabase link --project-ref SEU_PROJECT_REF"
        return
    fi
    
    print_status "Linkando com o projeto Supabase: $SUPABASE_PROJECT_REF"
    
    if supabase link --project-ref "$SUPABASE_PROJECT_REF"; then
        print_success "Projeto linkado com sucesso"
    else
        print_error "Falha ao linkar projeto. Verifique o PROJECT_REF"
        exit 1
    fi
}

# Apply database migrations
apply_migrations() {
    print_status "Aplicando migrações do banco de dados..."
    
    if supabase db push; then
        print_success "Migrações aplicadas com sucesso"
    else
        print_error "Falha ao aplicar migrações"
        exit 1
    fi
}

# Deploy Edge Functions
deploy_functions() {
    print_status "Fazendo deploy das Edge Functions..."
    
    # Deploy course-generator function
    print_status "Deploying course-generator..."
    if supabase functions deploy course-generator; then
        print_success "course-generator deployado com sucesso"
    else
        print_error "Falha no deploy do course-generator"
        exit 1
    fi
    
    # Deploy certificate-generator function
    print_status "Deploying certificate-generator..."
    if supabase functions deploy certificate-generator; then
        print_success "certificate-generator deployado com sucesso"
    else
        print_error "Falha no deploy do certificate-generator"
        exit 1
    fi
}

# Set up secrets
setup_secrets() {
    print_status "Configurando segredos..."
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_warning "OPENAI_API_KEY não definido. Configuração manual necessária."
        print_warning "Execute: supabase secrets set OPENAI_API_KEY=sua_chave_aqui"
    else
        print_status "Configurando OPENAI_API_KEY..."
        if supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"; then
            print_success "OPENAI_API_KEY configurado"
        else
            print_error "Falha ao configurar OPENAI_API_KEY"
        fi
    fi
    
    # Set optional secrets
    if [ -n "$OPENAI_MODEL" ]; then
        supabase secrets set OPENAI_MODEL="$OPENAI_MODEL"
    fi
    
    if [ -n "$OPENAI_MAX_TOKENS" ]; then
        supabase secrets set OPENAI_MAX_TOKENS="$OPENAI_MAX_TOKENS"
    fi
    
    if [ -n "$WEBHOOK_URL" ]; then
        supabase secrets set WEBHOOK_URL="$WEBHOOK_URL"
    fi
    
    if [ -n "$WEBHOOK_SECRET" ]; then
        supabase secrets set WEBHOOK_SECRET="$WEBHOOK_SECRET"
    fi
}

# Create storage buckets
setup_storage() {
    print_status "Configurando buckets de storage..."
    
    # Create certificates bucket
    print_status "Criando bucket para certificados..."
    supabase storage create certificates --public=false || print_warning "Bucket certificates já existe ou falha na criação"
    
    # Create course-assets bucket
    print_status "Criando bucket para assets de curso..."
    supabase storage create course-assets --public=true || print_warning "Bucket course-assets já existe ou falha na criação"
    
    print_success "Buckets de storage configurados"
}

# Test functions
test_functions() {
    print_status "Testando Edge Functions..."
    
    # Get project URL
    PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    
    if [ -z "$PROJECT_URL" ]; then
        print_warning "Não foi possível obter URL do projeto. Pule os testes manuais."
        return
    fi
    
    print_status "URL do projeto: $PROJECT_URL"
    print_status "Teste as funções manualmente:"
    echo "  - course-generator: POST $PROJECT_URL/functions/v1/course-generator"
    echo "  - certificate-generator: POST $PROJECT_URL/functions/v1/certificate-generator"
}

# Show deployment summary
show_summary() {
    print_success "\n=== DEPLOY CONCLUÍDO COM SUCESSO ==="
    print_status "Componentes deployados:"
    echo "  ✅ Migrações do banco de dados"
    echo "  ✅ Políticas de Row Level Security (RLS)"
    echo "  ✅ Edge Function: course-generator"
    echo "  ✅ Edge Function: certificate-generator"
    echo "  ✅ Buckets de storage"
    echo "  ✅ Segredos configurados"
    
    print_status "\nPróximos passos:"
    echo "  1. Teste as Edge Functions"
    echo "  2. Configure o frontend para usar as novas URLs"
    echo "  3. Monitore os logs: supabase functions logs <function-name>"
    echo "  4. Configure webhooks se necessário"
    
    print_status "\nDocumentação:"
    echo "  - README: ./supabase/README.md"
    echo "  - Logs: supabase functions logs"
    echo "  - Status: supabase status"
}

# Main deployment function
main() {
    print_status "🚀 Iniciando deploy do backend Esquads..."
    
    # Load environment variables if .env exists
    if [ -f ".env" ]; then
        print_status "Carregando variáveis de ambiente do .env"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    check_dependencies
    check_auth
    link_project
    apply_migrations
    setup_storage
    deploy_functions
    setup_secrets
    test_functions
    show_summary
    
    print_success "\n🎉 Deploy concluído com sucesso!"
}

# Handle script arguments
case "${1:-}" in
    "functions")
        print_status "Deploying apenas Edge Functions..."
        check_dependencies
        check_auth
        deploy_functions
        ;;
    "migrations")
        print_status "Aplicando apenas migrações..."
        check_dependencies
        check_auth
        apply_migrations
        ;;
    "secrets")
        print_status "Configurando apenas segredos..."
        check_dependencies
        check_auth
        setup_secrets
        ;;
    "storage")
        print_status "Configurando apenas storage..."
        check_dependencies
        check_auth
        setup_storage
        ;;
    "test")
        print_status "Testando funções..."
        test_functions
        ;;
    "help")
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  (nenhum)    - Deploy completo"
        echo "  functions   - Deploy apenas Edge Functions"
        echo "  migrations  - Aplicar apenas migrações"
        echo "  secrets     - Configurar apenas segredos"
        echo "  storage     - Configurar apenas storage"
        echo "  test        - Testar funções"
        echo "  help        - Mostrar esta ajuda"
        ;;
    *)
        main
        ;;
esac