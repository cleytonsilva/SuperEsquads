// PDF Certificate Generation using pdf-lib
// Geração de certificados em PDF usando pdf-lib

import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'
import { InternalServerError } from './errors.ts'

/**
 * Interface para dados do certificado
 */
export interface CertificateData {
  studentName: string
  courseName: string
  completionDate: Date
  finalGrade?: number
  certificateId: string
  instructorName?: string
  courseDuration?: number // em horas
}

/**
 * Configurações de estilo para o certificado
 */
interface CertificateStyle {
  pageWidth: number
  pageHeight: number
  backgroundColor: [number, number, number]
  primaryColor: [number, number, number]
  secondaryColor: [number, number, number]
  textColor: [number, number, number]
  borderColor: [number, number, number]
}

/**
 * Estilo padrão para certificados
 */
const DEFAULT_STYLE: CertificateStyle = {
  pageWidth: 842, // A4 landscape
  pageHeight: 595,
  backgroundColor: [1, 1, 1], // Branco
  primaryColor: [0.2, 0.4, 0.8], // Azul
  secondaryColor: [0.8, 0.6, 0.2], // Dourado
  textColor: [0.2, 0.2, 0.2], // Cinza escuro
  borderColor: [0.2, 0.4, 0.8] // Azul
}

/**
 * Classe para geração de certificados em PDF
 */
export class CertificateGenerator {
  private style: CertificateStyle

  constructor(style: Partial<CertificateStyle> = {}) {
    this.style = { ...DEFAULT_STYLE, ...style }
  }

  /**
   * Gera um certificado em PDF
   */
  async generateCertificate(data: CertificateData): Promise<Uint8Array> {
    try {
      // Cria novo documento PDF
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([this.style.pageWidth, this.style.pageHeight])
      
      // Carrega fontes
      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
      
      // Dimensões da página
      const { width, height } = page.getSize()
      
      // Desenha fundo
      this.drawBackground(page, width, height)
      
      // Desenha bordas decorativas
      this.drawBorders(page, width, height)
      
      // Desenha cabeçalho
      this.drawHeader(page, titleFont, width)
      
      // Desenha conteúdo principal
      this.drawMainContent(page, data, titleFont, bodyFont, italicFont, width, height)
      
      // Desenha rodapé
      this.drawFooter(page, data, bodyFont, italicFont, width)
      
      // Serializa o PDF
      const pdfBytes = await pdfDoc.save()
      return pdfBytes
      
    } catch (error) {
      console.error('Erro ao gerar certificado PDF:', error)
      throw new InternalServerError('Falha na geração do certificado PDF')
    }
  }

  /**
   * Desenha o fundo do certificado
   */
  private drawBackground(page: any, width: number, height: number): void {
    // Fundo branco
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(...this.style.backgroundColor)
    })
    
    // Elementos decorativos de fundo
    const decorativeElements = [
      { x: 50, y: height - 100, size: 30, opacity: 0.1 },
      { x: width - 80, y: height - 100, size: 30, opacity: 0.1 },
      { x: 50, y: 100, size: 30, opacity: 0.1 },
      { x: width - 80, y: 100, size: 30, opacity: 0.1 }
    ]
    
    decorativeElements.forEach(elem => {
      page.drawCircle({
        x: elem.x,
        y: elem.y,
        size: elem.size,
        color: rgb(...this.style.primaryColor),
        opacity: elem.opacity
      })
    })
  }

  /**
   * Desenha bordas decorativas
   */
  private drawBorders(page: any, width: number, height: number): void {
    const margin = 30
    const borderWidth = 3
    
    // Borda externa
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - (margin * 2),
      height: height - (margin * 2),
      borderColor: rgb(...this.style.borderColor),
      borderWidth: borderWidth
    })
    
    // Borda interna decorativa
    const innerMargin = margin + 15
    page.drawRectangle({
      x: innerMargin,
      y: innerMargin,
      width: width - (innerMargin * 2),
      height: height - (innerMargin * 2),
      borderColor: rgb(...this.style.secondaryColor),
      borderWidth: 1
    })
  }

  /**
   * Desenha o cabeçalho
   */
  private drawHeader(page: any, font: any, width: number): void {
    const centerX = width / 2
    
    // Logo/Nome da plataforma
    page.drawText('ESQUADS', {
      x: centerX - 60,
      y: 520,
      size: 24,
      font,
      color: rgb(...this.style.primaryColor)
    })
    
    // Título do certificado
    page.drawText('CERTIFICADO DE CONCLUSÃO', {
      x: centerX - 180,
      y: 470,
      size: 28,
      font,
      color: rgb(...this.style.textColor)
    })
    
    // Linha decorativa
    page.drawLine({
      start: { x: centerX - 200, y: 450 },
      end: { x: centerX + 200, y: 450 },
      thickness: 2,
      color: rgb(...this.style.secondaryColor)
    })
  }

  /**
   * Desenha o conteúdo principal
   */
  private drawMainContent(
    page: any, 
    data: CertificateData, 
    titleFont: any, 
    bodyFont: any, 
    italicFont: any,
    width: number, 
    height: number
  ): void {
    const centerX = width / 2
    
    // Texto de certificação
    page.drawText('Certificamos que', {
      x: centerX - 80,
      y: 400,
      size: 16,
      font: bodyFont,
      color: rgb(...this.style.textColor)
    })
    
    // Nome do aluno
    const studentNameWidth = titleFont.widthOfTextAtSize(data.studentName, 24)
    page.drawText(data.studentName, {
      x: centerX - (studentNameWidth / 2),
      y: 360,
      size: 24,
      font: titleFont,
      color: rgb(...this.style.primaryColor)
    })
    
    // Linha sob o nome
    page.drawLine({
      start: { x: centerX - (studentNameWidth / 2) - 10, y: 355 },
      end: { x: centerX + (studentNameWidth / 2) + 10, y: 355 },
      thickness: 1,
      color: rgb(...this.style.secondaryColor)
    })
    
    // Texto de conclusão
    page.drawText('concluiu com êxito o curso', {
      x: centerX - 120,
      y: 320,
      size: 16,
      font: bodyFont,
      color: rgb(...this.style.textColor)
    })
    
    // Nome do curso
    const courseNameWidth = titleFont.widthOfTextAtSize(data.courseName, 20)
    page.drawText(data.courseName, {
      x: centerX - (courseNameWidth / 2),
      y: 280,
      size: 20,
      font: titleFont,
      color: rgb(...this.style.primaryColor)
    })
    
    // Informações adicionais
    const completionDateStr = this.formatDate(data.completionDate)
    page.drawText(`Concluído em: ${completionDateStr}`, {
      x: centerX - 100,
      y: 240,
      size: 14,
      font: bodyFont,
      color: rgb(...this.style.textColor)
    })
    
    if (data.finalGrade !== undefined) {
      page.drawText(`Nota final: ${data.finalGrade.toFixed(1)}`, {
        x: centerX - 60,
        y: 220,
        size: 14,
        font: bodyFont,
        color: rgb(...this.style.textColor)
      })
    }
    
    if (data.courseDuration) {
      page.drawText(`Carga horária: ${data.courseDuration}h`, {
        x: centerX - 70,
        y: 200,
        size: 14,
        font: bodyFont,
        color: rgb(...this.style.textColor)
      })
    }
  }

  /**
   * Desenha o rodapé
   */
  private drawFooter(
    page: any, 
    data: CertificateData, 
    bodyFont: any, 
    italicFont: any, 
    width: number
  ): void {
    const centerX = width / 2
    
    // Assinatura (se houver instrutor)
    if (data.instructorName) {
      page.drawLine({
        start: { x: centerX - 100, y: 140 },
        end: { x: centerX + 100, y: 140 },
        thickness: 1,
        color: rgb(...this.style.textColor)
      })
      
      page.drawText(data.instructorName, {
        x: centerX - 60,
        y: 120,
        size: 12,
        font: bodyFont,
        color: rgb(...this.style.textColor)
      })
      
      page.drawText('Instrutor', {
        x: centerX - 25,
        y: 105,
        size: 10,
        font: italicFont,
        color: rgb(...this.style.textColor)
      })
    }
    
    // ID do certificado
    page.drawText(`Certificado ID: ${data.certificateId}`, {
      x: 60,
      y: 60,
      size: 10,
      font: bodyFont,
      color: rgb(0.6, 0.6, 0.6)
    })
    
    // Data de emissão
    const issueDate = new Date().toLocaleDateString('pt-BR')
    page.drawText(`Emitido em: ${issueDate}`, {
      x: width - 150,
      y: 60,
      size: 10,
      font: bodyFont,
      color: rgb(0.6, 0.6, 0.6)
    })
    
    // URL de verificação
    page.drawText('Verifique a autenticidade em: esquads.com/verify', {
      x: centerX - 140,
      y: 40,
      size: 10,
      font: italicFont,
      color: rgb(0.6, 0.6, 0.6)
    })
  }

  /**
   * Formata data para exibição
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * Função utilitária para gerar certificado
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const generator = new CertificateGenerator()
  return await generator.generateCertificate(data)
}

/**
 * Gera um ID único para o certificado
 */
export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `CERT-${timestamp}-${randomStr}`.toUpperCase()
}

/**
 * Valida dados do certificado
 */
export function validateCertificateData(data: Partial<CertificateData>): CertificateData {
  if (!data.studentName || data.studentName.trim().length === 0) {
    throw new Error('Nome do aluno é obrigatório')
  }
  
  if (!data.courseName || data.courseName.trim().length === 0) {
    throw new Error('Nome do curso é obrigatório')
  }
  
  if (!data.completionDate || !(data.completionDate instanceof Date)) {
    throw new Error('Data de conclusão inválida')
  }
  
  if (!data.certificateId || data.certificateId.trim().length === 0) {
    throw new Error('ID do certificado é obrigatório')
  }
  
  return {
    studentName: data.studentName.trim(),
    courseName: data.courseName.trim(),
    completionDate: data.completionDate,
    certificateId: data.certificateId.trim(),
    finalGrade: data.finalGrade,
    instructorName: data.instructorName?.trim(),
    courseDuration: data.courseDuration
  }
}