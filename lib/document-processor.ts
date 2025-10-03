/**
 * Document Processor for Multi-Format File Analysis
 *
 * Handles extraction and processing of:
 * - PDFs (insurance documents, estimates, letters)
 * - Word documents (.docx, .doc)
 * - Excel files (.xlsx, .xls)
 * - Text files (.txt)
 * - Images (JPG, PNG, HEIC, etc.)
 */

import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Use dynamic require for pdf-parse to avoid webpack issues
const pdfParse = typeof window === 'undefined' ? require('pdf-parse') : null;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProcessedDocument {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  metadata: DocumentMetadata;
  base64?: string; // For images
  preview?: string; // Preview text/data
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface DocumentMetadata {
  pageCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  creator?: string;
  creationDate?: string;
  modificationDate?: string;
  sheetNames?: string[]; // For Excel
  rowCount?: number; // For Excel
  columnCount?: number; // For Excel
  wordCount?: number;
  extractedData?: Record<string, any>;
  visionAnalysis?: {
    confidence: number;
    is_roof: boolean;
    damage_indicators: string[];
    materials?: string[];
    objects?: any[];
  };
}

export interface InsuranceData {
  claimNumber?: string;
  policyNumber?: string;
  insuranceCompany?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  dateOfLoss?: string;
  propertyAddress?: string;
  insuredName?: string;
  damageDescription?: string;
  estimatedAmount?: string;
  approvedAmount?: string;
  deductible?: string;
  checkNumber?: string;
  paymentDate?: string;
}

export interface DocumentAnalysisResult {
  success: boolean;
  timestamp: string;
  documentsProcessed: number;
  totalSize: number;
  documents: ProcessedDocument[];
  combinedText: string;
  insuranceData: InsuranceData;
  analysis: {
    summary: string;
    keyFindings: string[];
    damageDescriptions: string[];
    claimRelevantInfo: string[];
    recommendations: string[];
  };
  error?: string;
}

// ============================================================================
// DOCUMENT PROCESSOR CLASS
// ============================================================================

export class DocumentProcessor {

  private readonly SUPPORTED_TYPES = {
    pdf: ['application/pdf', '.pdf'],
    word: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      '.docx',
      '.doc'
    ],
    excel: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ],
    text: ['text/plain', '.txt'],
    image: [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif',
      'image/webp',
      '.jpg',
      '.jpeg',
      '.png',
      '.heic',
      '.heif',
      '.webp'
    ]
  };

  /**
   * Process a single file and extract content
   */
  async processFile(file: File | Buffer, fileName: string, mimeType?: string): Promise<ProcessedDocument> {
    const startTime = Date.now();

    console.log('[DocumentProcessor] ========================================');
    console.log('[DocumentProcessor] Processing file:', fileName);

    try {
      // Convert File to Buffer if needed
      const buffer = file instanceof Buffer ? file : await this.fileToBuffer(file as File);
      const actualMimeType = mimeType || (file instanceof Buffer ? '' : (file as File).type);
      const fileSize = buffer.length;

      console.log('[DocumentProcessor] File details:');
      console.log('[DocumentProcessor] - Size:', fileSize, 'bytes (', (fileSize / 1024).toFixed(2), 'KB )');
      console.log('[DocumentProcessor] - MIME type:', actualMimeType);

      // Determine file type
      const fileType = this.determineFileType(fileName, actualMimeType);
      console.log('[DocumentProcessor] - Detected file type:', fileType);

      let result: ProcessedDocument;

      switch (fileType) {
        case 'pdf':
          result = await this.processPDF(buffer, fileName, fileSize);
          break;
        case 'word':
          result = await this.processWord(buffer, fileName, fileSize);
          break;
        case 'excel':
          result = await this.processExcel(buffer, fileName, fileSize);
          break;
        case 'text':
          result = await this.processText(buffer, fileName, fileSize);
          break;
        case 'image':
          result = await this.processImage(buffer, fileName, fileSize);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      result.processingTime = Date.now() - startTime;
      console.log('[DocumentProcessor] ✓ Successfully processed:', fileName);
      console.log('[DocumentProcessor] - Type:', result.fileType);
      console.log('[DocumentProcessor] - Extracted text length:', result.extractedText.length, 'characters');
      console.log('[DocumentProcessor] - Preview:', result.extractedText.substring(0, 100).replace(/\n/g, ' '));
      console.log('[DocumentProcessor] - Processing time:', result.processingTime, 'ms');
      console.log('[DocumentProcessor] ========================================');

      return result;

    } catch (error: any) {
      console.error('[DocumentProcessor] Error processing file:', fileName);
      console.error('[DocumentProcessor] Error:', error.message);

      return {
        fileName,
        fileType: 'unknown',
        fileSize: 0,
        extractedText: '',
        metadata: {},
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process multiple files
   */
  async processMultipleFiles(files: Array<{ file: File | Buffer; fileName: string; mimeType?: string }>): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];

    for (const { file, fileName, mimeType } of files) {
      const result = await this.processFile(file, fileName, mimeType);
      results.push(result);
    }

    return results;
  }

  // ============================================================================
  // FILE TYPE PROCESSORS
  // ============================================================================

  private async processPDF(buffer: Buffer, fileName: string, fileSize: number): Promise<ProcessedDocument> {
    try {
      console.log('[DocumentProcessor] Processing PDF with pdf-parse...');
      console.log('[DocumentProcessor] - pdfParse available:', typeof pdfParse);

      if (!pdfParse) {
        throw new Error('pdf-parse library not available in this environment');
      }

      // Use pdf-parse which works better in serverless environments
      const data = await pdfParse(buffer);

      const extractedText = data.text;
      const numPages = data.numpages; // pdf-parse v1 uses 'numpages'

      console.log('[DocumentProcessor] PDF parsed successfully:');
      console.log('[DocumentProcessor] - Pages:', numPages);
      console.log('[DocumentProcessor] - Text length:', extractedText.length);

      const info = data.info as any; // Type assertion for info object

      return {
        fileName,
        fileType: 'pdf',
        fileSize,
        extractedText: extractedText.trim(),
        metadata: {
          pageCount: numPages,
          title: info?.Title,
          author: info?.Author,
          subject: info?.Subject,
          creator: info?.Creator,
          wordCount: this.countWords(extractedText)
        },
        preview: this.generatePreview(extractedText),
        processingTime: 0,
        success: true
      };
    } catch (error: any) {
      console.error('[DocumentProcessor] ============ PDF ERROR ============');
      console.error('[DocumentProcessor] Error type:', error.constructor.name);
      console.error('[DocumentProcessor] Error message:', error.message);
      console.error('[DocumentProcessor] Error stack:', error.stack);
      console.error('[DocumentProcessor] =====================================');

      // Return partial result with error
      return {
        fileName,
        fileType: 'pdf',
        fileSize,
        extractedText: '',
        metadata: {
          pageCount: 0,
          wordCount: 0
        },
        preview: '',
        processingTime: 0,
        success: false,
        error: `PDF processing failed: ${error.message}. This may be due to serverless environment limitations.`
      };
    }
  }

  private async processWord(buffer: Buffer, fileName: string, fileSize: number): Promise<ProcessedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      return {
        fileName,
        fileType: 'word',
        fileSize,
        extractedText: text,
        metadata: {
          wordCount: this.countWords(text)
        },
        preview: this.generatePreview(text),
        processingTime: 0,
        success: true
      };
    } catch (error: any) {
      throw new Error(`Word document processing failed: ${error.message}`);
    }
  }

  private async processExcel(buffer: Buffer, fileName: string, fileSize: number): Promise<ProcessedDocument> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;

      let extractedText = '';
      const extractedData: Record<string, any> = {};

      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert to text
        const sheetText = jsonData
          .map(row => (row as any[]).join('\t'))
          .join('\n');

        extractedText += `\n=== Sheet: ${sheetName} ===\n${sheetText}\n`;
        extractedData[sheetName] = jsonData;
      });

      return {
        fileName,
        fileType: 'excel',
        fileSize,
        extractedText: extractedText.trim(),
        metadata: {
          sheetNames,
          extractedData
        },
        preview: this.generatePreview(extractedText),
        processingTime: 0,
        success: true
      };
    } catch (error: any) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }

  private async processText(buffer: Buffer, fileName: string, fileSize: number): Promise<ProcessedDocument> {
    try {
      const text = buffer.toString('utf-8');

      console.log('[DocumentProcessor] Text file processing:');
      console.log('[DocumentProcessor] - Buffer size:', buffer.length);
      console.log('[DocumentProcessor] - Extracted text length:', text.length);
      console.log('[DocumentProcessor] - First 200 chars:', text.substring(0, 200).replace(/\n/g, ' '));

      if (!text || text.trim().length === 0) {
        console.warn('[DocumentProcessor] WARNING: Text file is empty!');
      }

      return {
        fileName,
        fileType: 'text',
        fileSize,
        extractedText: text,
        metadata: {
          wordCount: this.countWords(text)
        },
        preview: this.generatePreview(text),
        processingTime: 0,
        success: true
      };
    } catch (error: any) {
      throw new Error(`Text file processing failed: ${error.message}`);
    }
  }

  private async processImage(buffer: Buffer, fileName: string, fileSize: number): Promise<ProcessedDocument> {
    try {
      const base64 = buffer.toString('base64');
      const mimeType = this.getImageMimeType(fileName);

      return {
        fileName,
        fileType: 'image',
        fileSize,
        extractedText: '', // Will be analyzed by Abacus AI
        metadata: {},
        base64: `data:${mimeType};base64,${base64}`,
        preview: '[Image file - will be analyzed by AI]',
        processingTime: 0,
        success: true
      };
    } catch (error: any) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  // ============================================================================
  // INSURANCE DATA EXTRACTION
  // ============================================================================

  /**
   * Extract insurance-specific data from combined text
   */
  extractInsuranceData(combinedText: string): InsuranceData {
    const data: InsuranceData = {};

    // Claim number patterns
    const claimPatterns = [
      /claim\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i,
      /file\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i
    ];
    for (const pattern of claimPatterns) {
      const match = combinedText.match(pattern);
      if (match) {
        data.claimNumber = match[1].trim();
        break;
      }
    }

    // Policy number
    const policyPatterns = [
      /policy\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i
    ];
    for (const pattern of policyPatterns) {
      const match = combinedText.match(pattern);
      if (match) {
        data.policyNumber = match[1].trim();
        break;
      }
    }

    // Insurance company names
    const insuranceCompanies = [
      'State Farm', 'Allstate', 'GEICO', 'Progressive', 'USAA',
      'Liberty Mutual', 'Farmers', 'Nationwide', 'American Family',
      'Travelers', 'Erie', 'Auto-Owners', 'MetLife', 'Chubb',
      'Safeco', 'Mercury', 'Esurance', 'Amica', 'The Hartford'
    ];
    for (const company of insuranceCompanies) {
      if (combinedText.includes(company)) {
        data.insuranceCompany = company;
        break;
      }
    }

    // Adjuster information
    const adjusterNameMatch = combinedText.match(/adjuster[\s:]*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    if (adjusterNameMatch) {
      data.adjusterName = adjusterNameMatch[1].trim();
    }

    // Phone numbers (looking for adjuster phone)
    const phoneMatch = combinedText.match(/(?:adjuster|phone|tel)[\s:]*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i);
    if (phoneMatch) {
      data.adjusterPhone = phoneMatch[1].trim();
    }

    // Email addresses
    const emailMatch = combinedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      data.adjusterEmail = emailMatch[1].trim();
    }

    // Date of loss
    const datePatterns = [
      /date\s*of\s*loss[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /loss\s*date[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
    ];
    for (const pattern of datePatterns) {
      const match = combinedText.match(pattern);
      if (match) {
        data.dateOfLoss = match[1].trim();
        break;
      }
    }

    // Property address (simplified)
    const addressMatch = combinedText.match(/property\s*address[\s:]*([^\n]{10,100})/i);
    if (addressMatch) {
      data.propertyAddress = addressMatch[1].trim();
    }

    // Dollar amounts
    const amountPatterns = [
      { key: 'estimatedAmount', pattern: /(?:estimate|estimated)[\s:]*\$?([\d,]+\.?\d*)/i },
      { key: 'approvedAmount', pattern: /(?:approved|approved amount)[\s:]*\$?([\d,]+\.?\d*)/i },
      { key: 'deductible', pattern: /deductible[\s:]*\$?([\d,]+\.?\d*)/i }
    ];
    for (const { key, pattern } of amountPatterns) {
      const match = combinedText.match(pattern);
      if (match) {
        (data as any)[key] = `$${match[1].trim()}`;
      }
    }

    return data;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private determineFileType(fileName: string, mimeType: string): string {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

    for (const [type, identifiers] of Object.entries(this.SUPPORTED_TYPES)) {
      if (identifiers.includes(mimeType) || identifiers.includes(ext)) {
        return type;
      }
    }

    return 'unknown';
  }

  private getImageMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private generatePreview(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Check if file type is supported
   */
  isSupportedFileType(fileName: string, mimeType: string): boolean {
    return this.determineFileType(fileName, mimeType) !== 'unknown';
  }

  /**
   * Get supported file extensions as string
   */
  getSupportedExtensions(): string {
    return '.pdf,.docx,.doc,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.heic,.heif,.webp';
  }
}

// ============================================================================
// ABACUS AI ANALYZER
// ============================================================================

export class AbacusDocumentAnalyzer {

  /**
   * Analyze documents using Abacus AI
   */
  async analyzeDocuments(
    documents: ProcessedDocument[],
    deploymentToken: string,
    deploymentId: string
  ): Promise<DocumentAnalysisResult> {

    try {
      console.log('[AbacusAnalyzer] Starting analysis of', documents.length, 'documents');
      console.log('[AbacusAnalyzer] Document types:', documents.map(d => ({ name: d.fileName, type: d.fileType, success: d.success })));

      // Combine all extracted text
      const combinedText = documents
        .filter(doc => doc.success && doc.extractedText)
        .map(doc => `\n=== ${doc.fileName} ===\n${doc.extractedText}`)
        .join('\n\n');

      console.log('[AbacusAnalyzer] Combined text length:', combinedText.length);
      console.log('[AbacusAnalyzer] Combined text preview:', combinedText.substring(0, 500));
      console.log('[AbacusAnalyzer] Documents with extracted text:', documents.filter(doc => doc.success && doc.extractedText).length);

      // Log each document's extraction status
      documents.forEach(doc => {
        console.log(`[AbacusAnalyzer] ${doc.fileName}: success=${doc.success}, textLength=${doc.extractedText?.length || 0}, error=${doc.error || 'none'}`);
      });

      // Extract insurance data from combined text
      const processor = new DocumentProcessor();
      const insuranceData = processor.extractInsuranceData(combinedText);

      console.log('[AbacusAnalyzer] Extracted insurance data:', Object.keys(insuranceData).length, 'fields');

      // Check if we have ANY content to analyze
      const hasTextContent = combinedText.trim().length > 0;
      const hasImageContent = documents.some(doc => doc.fileType === 'image' && doc.base64);

      console.log('[AbacusAnalyzer] Content check:');
      console.log('[AbacusAnalyzer] - Has text content:', hasTextContent, '(length:', combinedText.trim().length, ')');
      console.log('[AbacusAnalyzer] - Has image content:', hasImageContent);
      console.log('[AbacusAnalyzer] - Total documents:', documents.length);
      console.log('[AbacusAnalyzer] - Successful documents:', documents.filter(d => d.success).length);

      if (!hasTextContent && !hasImageContent) {
        console.log('[AbacusAnalyzer] ERROR: No content to analyze - no text and no images');
        console.log('[AbacusAnalyzer] Documents status:', documents.map(d => ({
          name: d.fileName,
          type: d.fileType,
          success: d.success,
          textLength: d.extractedText?.length || 0,
          hasBase64: !!d.base64
        })));
        throw new Error('No analyzable content found in uploaded documents. Please ensure files contain readable text or are valid images.');
      }

      // Build comprehensive analysis prompt
      let analysisPrompt = `Analyze the following insurance claim documents and provide detailed insights:\n\n`;

      // Add text documents
      if (combinedText.trim()) {
        analysisPrompt += `DOCUMENT CONTENTS:\n${combinedText}\n\n`;
        console.log('[AbacusAnalyzer] ✓ Document text added to prompt (length:', combinedText.length, ')');
      } else {
        console.log('[AbacusAnalyzer] ⚠️ WARNING: No extracted text from documents - may be images only or extraction failed');
        console.log('[AbacusAnalyzer] Document processing statuses:', documents.map(d => ({
          name: d.fileName,
          success: d.success,
          textLength: d.extractedText?.length || 0,
          error: d.error
        })));
      }

      analysisPrompt += `Please provide:\n`;
      analysisPrompt += `1. A comprehensive summary of the claim\n`;
      analysisPrompt += `2. Key findings and important information\n`;
      analysisPrompt += `3. Damage descriptions mentioned in the documents\n`;
      analysisPrompt += `4. Claim-relevant information (amounts, dates, parties involved)\n`;
      analysisPrompt += `5. Recommendations for next steps\n\n`;
      analysisPrompt += `Be specific and professional in your analysis.`;

      console.log('[AbacusAnalyzer] Analysis prompt ready - length:', analysisPrompt.length);

      // Prepare messages for Abacus AI (correct format)
      const messages: any[] = [
        {
          is_user: false,
          text: 'You are Susan AI, an expert insurance claim analyst specializing in roofing insurance claims.'
        },
        {
          is_user: true,
          text: analysisPrompt
        }
      ];

      console.log('[AbacusAnalyzer] Sending to Abacus AI:');
      console.log('[AbacusAnalyzer] - Prompt length:', analysisPrompt.length);
      console.log('[AbacusAnalyzer] - Messages count:', messages.length);

      // Call Abacus AI
      const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentToken,
          deploymentId,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Abacus AI API error: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('[AbacusAnalyzer] Abacus AI response received');
      console.log('[AbacusAnalyzer] Response structure:', JSON.stringify(data).substring(0, 200));

      // Extract AI response
      let aiResponse = '';
      if (data.result && data.result.messages && Array.isArray(data.result.messages)) {
        const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user);
        if (assistantMessages.length > 0) {
          aiResponse = assistantMessages[assistantMessages.length - 1].text;
          console.log('[AbacusAnalyzer] AI response length:', aiResponse.length);
          console.log('[AbacusAnalyzer] AI response preview:', aiResponse.substring(0, 150));
        } else {
          console.log('[AbacusAnalyzer] WARNING: No assistant messages found in response');
        }
      } else {
        console.log('[AbacusAnalyzer] WARNING: Invalid response structure from Abacus AI');
      }

      // Parse AI response into structured format
      const analysis = this.parseAnalysisResponse(aiResponse);

      // Count successfully processed documents
      const successfullyProcessed = documents.filter(doc => doc.success).length;

      console.log('[AbacusAnalyzer] Analysis complete:');
      console.log('[AbacusAnalyzer] - Total documents:', documents.length);
      console.log('[AbacusAnalyzer] - Successfully processed:', successfullyProcessed);
      console.log('[AbacusAnalyzer] - Has AI summary:', !!analysis.summary);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        documentsProcessed: successfullyProcessed, // Fixed: count only successful documents
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        documents,
        combinedText,
        insuranceData,
        analysis
      };

    } catch (error: any) {
      console.error('[AbacusAnalyzer] Analysis error:', error);
      console.error('[AbacusAnalyzer] Error stack:', error.stack);

      // Count successfully processed documents even in error case
      const successfullyProcessed = documents.filter(doc => doc.success).length;

      return {
        success: false,
        timestamp: new Date().toISOString(),
        documentsProcessed: successfullyProcessed, // Fixed: use successful count
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        documents,
        combinedText: '',
        insuranceData: {},
        analysis: {
          summary: `Analysis failed: ${error.message}`,
          keyFindings: [],
          damageDescriptions: [],
          claimRelevantInfo: [],
          recommendations: []
        },
        error: error.message
      };
    }
  }

  private parseAnalysisResponse(response: string): DocumentAnalysisResult['analysis'] {
    console.log('[AbacusAnalyzer] Parsing AI response - length:', response.length);

    // If response is empty or too short, return empty analysis
    if (!response || response.length < 20) {
      console.log('[AbacusAnalyzer] WARNING: Response is empty or too short');
      return {
        summary: 'No analysis generated. Please check document content.',
        keyFindings: [],
        damageDescriptions: [],
        claimRelevantInfo: [],
        recommendations: []
      };
    }

    // Simple parsing - extract sections
    const summary = this.extractSection(response, 'summary', 'Summary:');
    const keyFindings = this.extractListSection(response, 'Key findings', 'key finding');
    const damageDescriptions = this.extractListSection(response, 'damage description', 'damage');
    const claimInfo = this.extractListSection(response, 'claim-relevant', 'amount');
    const recommendations = this.extractListSection(response, 'recommendation', 'next step');

    console.log('[AbacusAnalyzer] Parsed sections:');
    console.log('[AbacusAnalyzer] - Summary length:', summary?.length || 0);
    console.log('[AbacusAnalyzer] - Key findings:', keyFindings.length);
    console.log('[AbacusAnalyzer] - Damage descriptions:', damageDescriptions.length);
    console.log('[AbacusAnalyzer] - Claim info:', claimInfo.length);
    console.log('[AbacusAnalyzer] - Recommendations:', recommendations.length);

    // Use full response as summary if no summary section found
    const finalSummary = summary || response.substring(0, Math.min(500, response.length));

    return {
      summary: finalSummary,
      keyFindings,
      damageDescriptions,
      claimRelevantInfo: claimInfo,
      recommendations
    };
  }

  private extractSection(text: string, sectionName: string, marker: string): string {
    const regex = new RegExp(`${marker}\\s*([^\\n]+(?:\\n(?!\\d\\.).*)*?)(?=\\n\\n|\\n\\d\\.|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractListSection(text: string, sectionName: string, keyword: string): string[] {
    const items: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.match(/^\d+\./) || line.match(/^[-*•]/)) {
        const cleaned = line.replace(/^[\d\.\-\*•\s]+/, '').trim();
        if (cleaned.toLowerCase().includes(keyword.toLowerCase()) || cleaned.length > 10) {
          items.push(cleaned);
        }
      }
    }

    return items.slice(0, 10); // Limit to 10 items
  }
}

// Export singleton instances
export const documentProcessor = new DocumentProcessor();
export const abacusAnalyzer = new AbacusDocumentAnalyzer();
export default documentProcessor;
