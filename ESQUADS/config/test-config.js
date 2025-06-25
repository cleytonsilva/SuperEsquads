/**
 * Configurações centralizadas para testes
 * Este arquivo define todas as configurações necessárias para execução dos testes
 */

module.exports = {
  // Configurações do servidor
  server: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api',
    timeout: 30000,
    retries: 3
  },

  // Configurações específicas dos testes E2E
  e2e: {
    totalTests: 50,
    successRate: 0.85, // 85% de sucesso mínimo
    categories: {
      auth: { weight: 0.4, critical: true },
      ai: { weight: 0.3, critical: false },
      payments: { weight: 0.2, critical: true },
      missions: { weight: 0.1, critical: false }
    }
  },

  // Configurações de relatórios
  reports: {
    outputDir: './reports',
    formats: ['markdown', 'json'],
    includeMetrics: true,
    includeLogs: true
  },

  // Configurações de ambiente
  environment: {
    requiredVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    minSecretLength: 32
  },

  // Configurações de performance
  performance: {
    maxResponseTime: 5000, // 5 segundos
    maxMemoryUsage: '512MB',
    concurrentTests: 3
  },

  // Configurações de segurança
  security: {
    testSqlInjection: true,
    testXss: true,
    testCsrf: true,
    validateHeaders: true
  },

  // Configurações de acessibilidade
  accessibility: {
    checkWcag: true,
    level: 'AA',
    includeColorContrast: true
  },

  // Configurações de compatibilidade
  compatibility: {
    browsers: ['chrome', 'firefox', 'safari'],
    devices: ['desktop', 'tablet', 'mobile'],
    resolutions: ['1920x1080', '1366x768', '375x667']
  },

  // Dados de teste
  testData: {
    users: {
      admin: {
        email: 'admin@esquads.com',
        password: 'admin123',
        role: 'admin'
      },
      student: {
        email: 'student@esquads.com',
        password: 'student123',
        role: 'student'
      },
      instructor: {
        email: 'instructor@esquads.com',
        password: 'instructor123',
        role: 'instructor'
      }
    },
    courses: {
      sample: {
        title: 'Curso de Teste',
        description: 'Curso para testes automatizados',
        duration: 60
      }
    }
  }
};