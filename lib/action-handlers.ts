/**
 * Action Handler System
 *
 * Central system for handling all button actions in the SusanAI-21 application.
 * Replaces message prefill functionality with actual action execution.
 */

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
  templateKey?: string;
  variables?: Record<string, string>;
}

export interface StormData {
  address: string;
  date: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
}

export interface StormEvent {
  date: string;
  location: string;
  hailSize: string;
  windSpeed?: string;
  severity: string;
  distance: number; // miles from property
}

export interface TemplateGenerationOptions {
  templateKey?: string;
  autoDetect?: boolean;
  input?: string;
  variables?: Record<string, string>;
}

export interface PhotoAnalysisOptions {
  files: File[];
  propertyAddress?: string;
  claimDate?: string;
  roofAge?: string;
  hailSize?: string;
  mode?: 'single' | 'batch';
}

export interface ReportExportOptions {
  sessionId: string;
  format: 'pdf' | 'docx';
  includePhotos?: boolean;
  includeAnalysis?: boolean;
  includeEmails?: boolean;
}

export class ActionHandler {

  /**
   * Handle template generation action
   */
  async handleTemplateGeneration(
    options: TemplateGenerationOptions
  ): Promise<ActionResult> {
    try {
      const body = options.autoDetect
        ? { input: options.input }
        : { templateKey: options.templateKey, variables: options.variables };

      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to generate template',
        };
      }

      return {
        success: true,
        data: data,
        message: 'Template generated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Template generation failed',
      };
    }
  }

  /**
   * Handle photo analysis action
   */
  async handlePhotoAnalysis(
    options: PhotoAnalysisOptions
  ): Promise<ActionResult> {
    try {
      if (options.files.length === 0) {
        return {
          success: false,
          error: 'No files selected for analysis',
        };
      }

      const formData = new FormData();

      if (options.mode === 'single') {
        formData.append('photo', options.files[0]);
      } else {
        options.files.forEach((file, index) => {
          formData.append(`photo${index}`, file);
        });
      }

      // Add context parameters
      if (options.propertyAddress) formData.append('propertyAddress', options.propertyAddress);
      if (options.claimDate) formData.append('claimDate', options.claimDate);
      if (options.roofAge) formData.append('roofAge', options.roofAge);
      if (options.hailSize) formData.append('hailSize', options.hailSize);

      const endpoint = options.mode === 'single'
        ? '/api/photo/analyze'
        : '/api/photo/batch';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Photo analysis failed',
        };
      }

      return {
        success: true,
        data: data,
        message: `Successfully analyzed ${options.files.length} photo(s)`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Photo analysis failed',
      };
    }
  }

  /**
   * Handle email send action
   */
  async handleEmailSend(payload: EmailPayload): Promise<ActionResult> {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to send email',
        };
      }

      return {
        success: true,
        data: data,
        message: `Email sent successfully to ${payload.to}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Email send failed',
      };
    }
  }

  /**
   * Handle storm verification action with NOAA API
   */
  async handleStormVerification(data: StormData): Promise<ActionResult> {
    try {
      const response = await fetch('/api/weather/verify-storm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Storm verification failed',
        };
      }

      return {
        success: true,
        data: result,
        message: `Found ${result.events?.length || 0} storm events`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Storm verification failed',
      };
    }
  }

  /**
   * Handle insurance company selection
   */
  async handleCompanySelection(companyId: string): Promise<ActionResult> {
    try {
      const response = await fetch(`/api/insurance/company/${companyId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to fetch company information',
        };
      }

      return {
        success: true,
        data: data.company,
        message: `Selected ${data.company.name}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Company selection failed',
      };
    }
  }

  /**
   * Handle report export action
   */
  async handleReportExport(options: ReportExportOptions): Promise<ActionResult> {
    try {
      const response = await fetch('/api/report/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Report export failed',
        };
      }

      // Get the blob for download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim_report_${options.sessionId}_${new Date().toISOString().split('T')[0]}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Report downloaded successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Report export failed',
      };
    }
  }

  /**
   * Handle voice command execution
   */
  async handleVoiceCommand(command: string): Promise<ActionResult> {
    try {
      const response = await fetch('/api/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Voice command execution failed',
        };
      }

      return {
        success: true,
        data: data,
        message: 'Command executed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Voice command execution failed',
      };
    }
  }

  /**
   * Get insurance companies list
   */
  async getInsuranceCompanies(search?: string): Promise<ActionResult> {
    try {
      const url = search
        ? `/api/insurance/companies?search=${encodeURIComponent(search)}`
        : '/api/insurance/companies';

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to fetch companies',
        };
      }

      return {
        success: true,
        data: data.companies,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch companies',
      };
    }
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<ActionResult> {
    try {
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to fetch templates',
        };
      }

      return {
        success: true,
        data: data.templates,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch templates',
      };
    }
  }
}

// Export singleton instance
export const actionHandler = new ActionHandler();
