// LLM Integration utilities (OpenAI, Gemini, etc.)
// Integração com APIs de IA (OpenAI, Gemini, etc.)

import { ExternalServiceError, InternalServerError } from './errors.ts'
import { validateData, LLMCourseResponseSchema, LLMQuizResponseSchema } from './validation.ts'

/**
 * Interface para configuração de LLM
 */
interface LLMConfig {
  apiKey: string
  model: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

/**
 * Interface para resposta de LLM
 */
interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Cliente para OpenAI API
 */
export class OpenAIClient {
  private config: LLMConfig
  private baseUrl = 'https://api.openai.com/v1'

  constructor(config: LLMConfig) {
    this.config = {
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 60000,
      ...config
    }
  }

  async generateCompletion(
    prompt: string,
    systemMessage?: string
  ): Promise<LLMResponse> {
    try {
      const messages = []
      
      if (systemMessage) {
        messages.push({
          role: 'system',
          content: systemMessage
        })
      }
      
      messages.push({
        role: 'user',
        content: prompt
      })

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        }),
        signal: AbortSignal.timeout(this.config.timeout!)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ExternalServiceError(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
          'OpenAI'
        )
      }

      const data = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        throw new ExternalServiceError('Resposta vazia da OpenAI API', 'OpenAI')
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined
      }

    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error
      }
      
      if (error.name === 'TimeoutError') {
        throw new ExternalServiceError('Timeout na requisição para OpenAI API', 'OpenAI')
      }
      
      console.error('Erro na OpenAI API:', error)
      throw new ExternalServiceError('Falha na comunicação com OpenAI API', 'OpenAI')
    }
  }
}

/**
 * Prompts padronizados para geração de conteúdo
 */
export class CoursePrompts {
  /**
   * Prompt para gerar estrutura do curso
   */
  static generateCourseStructure(topic: string, audience: string, moduleCount: number): string {
    return `Crie um plano de curso detalhado para o tópico "${topic}" focado em "${audience}", dividido em ${moduleCount} módulos.

Requisitos:
- Cada módulo deve ter entre 3 a 5 lições
- O curso deve ser progressivo, do básico ao avançado
- Inclua uma descrição breve do curso (2-3 frases)
- Inclua uma descrição para cada módulo (1-2 frases)
- Os títulos devem ser claros e específicos
- O conteúdo deve ser técnico e educacional

Retorne o resultado EXATAMENTE no formato JSON abaixo:
{
  "courseTitle": "Título do curso",
  "courseDescription": "Descrição do curso",
  "modules": [
    {
      "moduleTitle": "Título do módulo 1",
      "moduleDescription": "Descrição do módulo 1",
      "lessons": ["Título da lição 1", "Título da lição 2", "Título da lição 3"]
    }
  ]
}`
  }

  /**
   * Prompt para gerar conteúdo de lição
   */
  static generateLessonContent(
    lessonTitle: string, 
    courseTitle: string, 
    moduleTitle: string,
    audience: string
  ): string {
    return `Escreva um conteúdo educacional detalhado e técnico para a lição "${lessonTitle}" do módulo "${moduleTitle}" do curso "${courseTitle}".

Público-alvo: ${audience}

Requisitos:
- Conteúdo deve ter entre 800 a 1500 palavras
- Linguagem técnica mas acessível
- Inclua exemplos práticos quando relevante
- Estruture com subtítulos e parágrafos bem organizados
- Foque em conceitos fundamentais e aplicações práticas
- Use markdown para formatação (títulos, listas, código quando aplicável)

Retorne apenas o conteúdo da lição em markdown, sem introduções ou conclusões sobre a tarefa.`
  }

  /**
   * Prompt para gerar questionário
   */
  static generateQuiz(
    moduleTitle: string, 
    courseTitle: string, 
    lessonsContent: string[]
  ): string {
    const contentSummary = lessonsContent.join('\n\n---\n\n')
    
    return `Crie um questionário de 5 perguntas de múltipla escolha baseado no conteúdo do módulo "${moduleTitle}" do curso "${courseTitle}".

Conteúdo das lições:
${contentSummary}

Requisitos:
- 5 perguntas que testem compreensão dos conceitos principais
- 4 opções de resposta para cada pergunta
- Apenas uma resposta correta por pergunta
- Perguntas de dificuldade variada (fácil, média, difícil)
- Inclua uma explicação breve para cada resposta correta
- Evite perguntas muito óbvias ou muito específicas

Retorne o resultado EXATAMENTE no formato JSON abaixo:
[
  {
    "question": "Pergunta 1?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctAnswerIndex": 0,
    "explanation": "Explicação da resposta correta"
  }
]`
  }
}

/**
 * Serviço principal para geração de conteúdo com LLM
 */
export class LLMService {
  private client: OpenAIClient

  constructor(apiKey: string, model = 'gpt-4') {
    this.client = new OpenAIClient({
      apiKey,
      model,
      maxTokens: 4000,
      temperature: 0.7
    })
  }

  /**
   * Gera estrutura completa do curso
   */
  async generateCourseStructure(
    topic: string, 
    audience: string, 
    moduleCount: number
  ) {
    const prompt = CoursePrompts.generateCourseStructure(topic, audience, moduleCount)
    
    const systemMessage = `Você é um especialista em design instrucional e criação de cursos online. 
Sua tarefa é criar estruturas de curso bem organizadas e pedagogicamente sólidas. 
Sempre retorne respostas em JSON válido conforme solicitado.`
    
    const response = await this.client.generateCompletion(prompt, systemMessage)
    
    try {
      const jsonContent = this.extractJSON(response.content)
      return validateData(jsonContent, LLMCourseResponseSchema)
    } catch (error) {
      console.error('Erro ao parsear resposta da estrutura do curso:', response.content)
      throw new ExternalServiceError('Resposta inválida da IA para estrutura do curso', 'LLM')
    }
  }

  /**
   * Gera conteúdo de uma lição
   */
  async generateLessonContent(
    lessonTitle: string,
    courseTitle: string,
    moduleTitle: string,
    audience: string
  ): Promise<string> {
    const prompt = CoursePrompts.generateLessonContent(
      lessonTitle, 
      courseTitle, 
      moduleTitle, 
      audience
    )
    
    const systemMessage = `Você é um especialista em educação e criação de conteúdo técnico. 
Crie conteúdo educacional de alta qualidade, bem estruturado e didático.`
    
    const response = await this.client.generateCompletion(prompt, systemMessage)
    
    if (!response.content || response.content.trim().length < 100) {
      throw new ExternalServiceError('Conteúdo de lição muito curto ou vazio', 'LLM')
    }
    
    return response.content.trim()
  }

  /**
   * Gera questionário para um módulo
   */
  async generateQuiz(
    moduleTitle: string,
    courseTitle: string,
    lessonsContent: string[]
  ) {
    const prompt = CoursePrompts.generateQuiz(moduleTitle, courseTitle, lessonsContent)
    
    const systemMessage = `Você é um especialista em avaliação educacional. 
Crie questionários que testem efetivamente a compreensão dos alunos. 
Sempre retorne respostas em JSON válido conforme solicitado.`
    
    const response = await this.client.generateCompletion(prompt, systemMessage)
    
    try {
      const jsonContent = this.extractJSON(response.content)
      return validateData(jsonContent, LLMQuizResponseSchema)
    } catch (error) {
      console.error('Erro ao parsear resposta do questionário:', response.content)
      throw new ExternalServiceError('Resposta inválida da IA para questionário', 'LLM')
    }
  }

  /**
   * Extrai JSON de uma resposta que pode conter texto adicional
   */
  private extractJSON(content: string): any {
    try {
      // Tenta parsear diretamente
      return JSON.parse(content)
    } catch {
      // Procura por JSON dentro do texto
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('JSON não encontrado na resposta')
    }
  }
}

/**
 * Factory para criar instância do LLMService
 */
export async function createLLMService(): Promise<LLMService> {
  // Obtém a chave da API dos segredos do Supabase
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!apiKey) {
    throw new InternalServerError('Chave da API OpenAI não configurada')
  }
  
  return new LLMService(apiKey)
}