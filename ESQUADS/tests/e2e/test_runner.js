/**
 * 🧪 SCRIPT DE EXECUÇÃO DE TESTES E2E
 * 
 * Este script automatiza a execução dos testes E2E baseados no checklist criado.
 * Executa testes em ordem de prioridade e gera relatórios detalhados.
 * 
 * Uso: node test_runner.js [categoria] [--verbose]
 * 
 * Categorias disponíveis:
 * - auth: Testes de autenticação
 * - ai: Testes de funcionalidades de IA
 * - payments: Testes de pagamentos
 * - missions: Testes de missões
 * - all: Todos os testes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações centralizadas
const testConfig = require('../../config/test-config.js');
const CONFIG = {
  ...testConfig.server,
  ...testConfig.e2e,
  reportFile: './E2E_TEST_REPORT.md'
};

// Polyfill para fetch no Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utilitários de log
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`)
};

// Definição dos testes por categoria
const TEST_SUITES = {
  auth: {
    name: 'Testes de Autenticação',
    priority: 'CRÍTICA',
    tests: [
      {
        id: 'T001',
        name: 'Registro com email válido',
        endpoint: '/api/auth?action=register',
        method: 'POST',
        payload: {
          email: 'test@example.com',
          password: 'TestPassword123!',
          full_name: 'Test User'
        },
        expectedStatus: 200,
        expectedResponse: { success: true }
      },
      {
        id: 'T002',
        name: 'Registro com email inválido',
        endpoint: '/api/auth?action=register',
        method: 'POST',
        payload: {
          email: 'invalid-email',
          password: 'TestPassword123!',
          full_name: 'Test User'
        },
        expectedStatus: 400,
        expectedResponse: { success: false }
      },
      {
        id: 'T008',
        name: 'Login com credenciais válidas',
        endpoint: '/api/auth?action=login',
        method: 'POST',
        payload: {
          email: 'admin@esquads.com',
          password: 'admin123'
        },
        expectedStatus: 200,
        expectedResponse: { success: true }
      }
    ]
  },
  
  content: {
    name: 'Testes de Geração de Conteúdo',
    priority: 'ALTA',
    tests: [
      {
        id: 'T025',
        name: 'Geração de conteúdo básica',
        endpoint: '/api/generate-content',
        method: 'POST',
        payload: {
          prompt: 'Escreva um parágrafo sobre programação',
          type: 'text'
        },
        expectedStatus: 200,
        expectedResponse: { success: true },
        requiresAuth: true
      }
    ]
  },
  
  payments: {
    name: 'Testes de Pagamentos',
    priority: 'CRÍTICA',
    tests: [
      {
        id: 'T040',
        name: 'Listagem de métodos de pagamento',
        endpoint: '/api/payment-methods',
        method: 'GET',
        expectedStatus: 200,
        expectedResponse: { success: true },
        requiresAuth: true
      }
    ]
  },
  
  health: {
    name: 'Testes de Saúde do Sistema',
    priority: 'CRÍTICA',
    tests: [
      {
        id: 'T045',
        name: 'Health check do servidor',
        endpoint: '/api/health',
        method: 'GET',
        expectedStatus: 200,
        expectedResponse: { status: 'ok' },
        requiresAuth: false
      }
    ]
  }
};

module.exports = { TEST_SUITES, log, colors };