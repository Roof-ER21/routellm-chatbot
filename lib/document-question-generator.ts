/**
 * Document Question Generator
 *
 * Generates contextual questions based on:
 * - Document type and content
 * - Missing information
 * - User's goal (supplement, full approval, etc.)
 * - Claim status
 */

import { ProcessedDocument } from './document-processor';
import { EstimateAnalysis, estimateParser } from './estimate-parser';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContextQuestion {
  id: string;
  question: string;
  type: 'text' | 'date' | 'choice' | 'number' | 'address' | 'multiselect';
  options?: string[];
  required: boolean;
  followUp?: string;
  category: 'claim' | 'property' | 'damage' | 'insurance' | 'goal' | 'timeline';
  helpText?: string;
  placeholder?: string;
}

export interface QuestionFlowState {
  currentIndex: number;
  answers: Record<string, any>;
  questions: ContextQuestion[];
  completed: boolean;
  documentContext: {
    types: string[];
    hasEstimate: boolean;
    hasPhotos: boolean;
    hasDenialLetter: boolean;
    hasAdjusterReport: boolean;
  };
}

export interface QuestionGenerationOptions {
  goal?: 'supplement' | 'initial_claim' | 'appeal_denial' | 'full_review';
  claimStatus?: 'not_filed' | 'pending' | 'approved' | 'partial_denial' | 'full_denial';
  documentTypes?: string[];
  extractedData?: Record<string, any>;
  missingCodeItems?: string[];
}

// ============================================================================
// QUESTION TEMPLATES
// ============================================================================

/**
 * Pre-defined question templates organized by category
 */
const QUESTION_TEMPLATES = {

  // Claim Information
  claim: {
    stormDate: {
      id: 'storm_date',
      question: 'When did the storm or damage event occur?',
      type: 'date' as const,
      required: true,
      category: 'claim' as const,
      helpText: 'This is critical for verifying your claim against weather records',
      placeholder: 'MM/DD/YYYY'
    },
    claimFiled: {
      id: 'claim_filed',
      question: 'Have you already filed a claim with your insurance?',
      type: 'choice' as const,
      options: ['Yes, claim is open', 'Yes, claim was denied', 'Yes, partially approved', 'No, not yet filed'],
      required: true,
      category: 'claim' as const
    },
    claimNumber: {
      id: 'claim_number',
      question: 'What is your insurance claim number?',
      type: 'text' as const,
      required: false,
      category: 'claim' as const,
      placeholder: 'e.g., CLM-2024-123456'
    },
    policyNumber: {
      id: 'policy_number',
      question: 'What is your insurance policy number?',
      type: 'text' as const,
      required: false,
      category: 'claim' as const,
      placeholder: 'e.g., POL-987654321'
    }
  },

  // Property Information
  property: {
    address: {
      id: 'property_address',
      question: 'What is the property address?',
      type: 'address' as const,
      required: true,
      category: 'property' as const,
      placeholder: '123 Main St, City, State, ZIP'
    },
    roofAge: {
      id: 'roof_age',
      question: 'How old is the roof?',
      type: 'choice' as const,
      options: ['0-5 years', '6-10 years', '11-15 years', '16-20 years', 'Over 20 years', 'Unknown'],
      required: false,
      category: 'property' as const,
      helpText: 'Roof age affects coverage and replacement vs. repair decisions'
    },
    roofType: {
      id: 'roof_type',
      question: 'What type of roofing material do you have?',
      type: 'choice' as const,
      options: ['Asphalt Shingles', 'Tile', 'Metal', 'Flat/TPO', 'Other'],
      required: false,
      category: 'property' as const
    },
    roofSize: {
      id: 'roof_size',
      question: 'What is the approximate size of your roof (in squares)?',
      type: 'number' as const,
      required: false,
      category: 'property' as const,
      helpText: '1 square = 100 sq ft. Typical single-family home is 15-30 squares',
      placeholder: 'e.g., 25'
    }
  },

  // Damage Information
  damage: {
    damageType: {
      id: 'damage_type',
      question: 'What type of damage occurred?',
      type: 'multiselect' as const,
      options: ['Hail', 'Wind', 'Hurricane', 'Fallen Tree', 'Tornado', 'Water/Leak', 'Other'],
      required: true,
      category: 'damage' as const
    },
    visibleDamage: {
      id: 'visible_damage',
      question: 'Can you see visible damage from the ground?',
      type: 'choice' as const,
      options: ['Yes, significant damage', 'Yes, minor damage', 'No visible damage', 'Not sure'],
      required: true,
      category: 'damage' as const
    },
    interiorDamage: {
      id: 'interior_damage',
      question: 'Is there any interior damage (leaks, water stains, etc.)?',
      type: 'choice' as const,
      options: ['Yes, active leaking', 'Yes, water stains', 'No interior damage', 'Not sure'],
      required: false,
      category: 'damage' as const
    },
    damageDescription: {
      id: 'damage_description',
      question: 'Describe the damage you observed',
      type: 'text' as const,
      required: false,
      category: 'damage' as const,
      placeholder: 'e.g., Missing shingles on north side, dented gutters, broken ridge vent...',
      helpText: 'Be specific about location and type of damage'
    }
  },

  // Insurance Information
  insurance: {
    insuranceCompany: {
      id: 'insurance_company',
      question: 'Who is your insurance company?',
      type: 'choice' as const,
      options: [
        'State Farm',
        'Allstate',
        'GEICO',
        'Progressive',
        'USAA',
        'Liberty Mutual',
        'Farmers',
        'Nationwide',
        'Travelers',
        'Other'
      ],
      required: false,
      category: 'insurance' as const
    },
    adjusterAssigned: {
      id: 'adjuster_assigned',
      question: 'Has an insurance adjuster been assigned to your claim?',
      type: 'choice' as const,
      options: ['Yes, already inspected', 'Yes, inspection scheduled', 'Yes, but no inspection yet', 'No adjuster assigned yet', 'Not applicable'],
      required: false,
      category: 'insurance' as const
    },
    adjusterName: {
      id: 'adjuster_name',
      question: "What is your adjuster's name?",
      type: 'text' as const,
      required: false,
      category: 'insurance' as const,
      placeholder: 'e.g., John Smith'
    },
    adjusterContact: {
      id: 'adjuster_contact',
      question: "What is your adjuster's phone number or email?",
      type: 'text' as const,
      required: false,
      category: 'insurance' as const,
      placeholder: 'e.g., (555) 123-4567 or adjuster@insurance.com'
    }
  },

  // User Goals
  goal: {
    primaryGoal: {
      id: 'primary_goal',
      question: 'What is your primary goal today?',
      type: 'choice' as const,
      options: [
        'File initial insurance claim',
        'Request supplement for denied items',
        'Appeal full denial',
        'Review adjuster estimate',
        'Get claim strategy advice',
        'Other'
      ],
      required: true,
      category: 'goal' as const
    },
    specificConcern: {
      id: 'specific_concern',
      question: 'What is your specific concern or question?',
      type: 'text' as const,
      required: false,
      category: 'goal' as const,
      placeholder: 'e.g., Why was my underlayment denied? How much should I expect?',
      helpText: 'Be as specific as possible'
    }
  },

  // Timeline
  timeline: {
    urgency: {
      id: 'urgency',
      question: 'How urgent is this claim?',
      type: 'choice' as const,
      options: [
        'Emergency - active leaks/damage',
        'High - need quick resolution',
        'Normal - standard timeline ok',
        'Low - just gathering information'
      ],
      required: false,
      category: 'timeline' as const
    },
    deadlines: {
      id: 'deadlines',
      question: 'Do you have any upcoming deadlines?',
      type: 'text' as const,
      required: false,
      category: 'timeline' as const,
      placeholder: 'e.g., Need to respond to denial by 12/31/2024',
      helpText: 'Include any appeal deadlines, inspection dates, etc.'
    }
  }
};

// ============================================================================
// QUESTION GENERATOR
// ============================================================================

export class DocumentQuestionGenerator {

  /**
   * Generate contextual questions based on documents and options
   */
  generateQuestions(
    documents: ProcessedDocument[],
    options: QuestionGenerationOptions = {}
  ): ContextQuestion[] {
    console.log('[QuestionGenerator] Generating questions...');
    console.log('[QuestionGenerator] Documents:', documents.length);
    console.log('[QuestionGenerator] Options:', options);

    const questions: ContextQuestion[] = [];

    // Analyze documents
    const docContext = this.analyzeDocuments(documents);
    console.log('[QuestionGenerator] Document context:', docContext);

    // Determine question flow based on context
    const flow = this.determineQuestionFlow(docContext, options);
    console.log('[QuestionGenerator] Question flow:', flow);

    // Build question set
    questions.push(...this.buildQuestionSet(flow, docContext, options));

    console.log('[QuestionGenerator] Generated', questions.length, 'questions');
    return questions;
  }

  /**
   * Analyze uploaded documents to understand context
   */
  private analyzeDocuments(documents: ProcessedDocument[]) {
    const types = documents.map(d => d.fileType);

    return {
      types,
      hasEstimate: documents.some(d =>
        d.extractedText.toLowerCase().includes('estimate') ||
        d.extractedText.toLowerCase().includes('line item') ||
        d.fileName.toLowerCase().includes('estimate')
      ),
      hasPhotos: documents.some(d => d.fileType === 'image'),
      hasDenialLetter: documents.some(d =>
        d.extractedText.toLowerCase().includes('denied') ||
        d.extractedText.toLowerCase().includes('not covered')
      ),
      hasAdjusterReport: documents.some(d =>
        d.extractedText.toLowerCase().includes('adjuster') &&
        d.extractedText.toLowerCase().includes('inspection')
      )
    };
  }

  /**
   * Determine optimal question flow
   */
  private determineQuestionFlow(
    docContext: ReturnType<typeof this.analyzeDocuments>,
    options: QuestionGenerationOptions
  ): string[] {
    const flow: string[] = [];

    // Always start with primary goal
    flow.push('goal.primaryGoal');

    // Claim status questions
    if (!options.claimStatus) {
      flow.push('claim.claimFiled');
    }

    // If has estimate, ask about storm/damage date
    if (docContext.hasEstimate || docContext.hasPhotos) {
      flow.push('claim.stormDate');
    }

    // If has denial letter, different questions
    if (docContext.hasDenialLetter) {
      flow.push('claim.claimNumber');
      flow.push('insurance.adjusterName');
      flow.push('goal.specificConcern');
    }

    // If no estimate, ask about property details
    if (!docContext.hasEstimate) {
      flow.push('property.address');
      flow.push('property.roofAge');
      flow.push('property.roofType');
      flow.push('damage.damageType');
      flow.push('damage.visibleDamage');
    }

    // If has photos but no estimate, ask about damage
    if (docContext.hasPhotos && !docContext.hasEstimate) {
      flow.push('damage.damageDescription');
    }

    // Insurance questions if not already filed
    if (!docContext.hasDenialLetter && !docContext.hasAdjusterReport) {
      flow.push('insurance.insuranceCompany');
      flow.push('insurance.adjusterAssigned');
    }

    // Timeline questions
    if (options.goal === 'appeal_denial' || docContext.hasDenialLetter) {
      flow.push('timeline.urgency');
      flow.push('timeline.deadlines');
    }

    return flow;
  }

  /**
   * Build question set from flow
   */
  private buildQuestionSet(
    flow: string[],
    docContext: ReturnType<typeof this.analyzeDocuments>,
    options: QuestionGenerationOptions
  ): ContextQuestion[] {
    const questions: ContextQuestion[] = [];

    for (const path of flow) {
      const question = this.getQuestionByPath(path);
      if (question) {
        questions.push({ ...question }); // Clone to avoid mutations
      }
    }

    // Add dynamic questions based on missing code items
    if (options.missingCodeItems && options.missingCodeItems.length > 0) {
      questions.push({
        id: 'missing_items_review',
        question: `The estimate appears to be missing ${options.missingCodeItems.length} code-required items. Would you like Susan to analyze what's missing and how to supplement?`,
        type: 'choice',
        options: ['Yes, analyze missing items', 'No, skip for now'],
        required: false,
        category: 'goal',
        helpText: `Missing items include: ${options.missingCodeItems.slice(0, 3).join(', ')}${options.missingCodeItems.length > 3 ? '...' : ''}`
      });
    }

    return questions;
  }

  /**
   * Get question by dot-notation path
   */
  private getQuestionByPath(path: string): ContextQuestion | null {
    const parts = path.split('.');
    if (parts.length !== 2) return null;

    const [category, key] = parts;
    const templates = QUESTION_TEMPLATES as any;

    if (templates[category] && templates[category][key]) {
      return templates[category][key];
    }

    return null;
  }

  /**
   * Create a question flow state for multi-step questioning
   */
  createQuestionFlow(
    questions: ContextQuestion[]
  ): QuestionFlowState {
    return {
      currentIndex: 0,
      answers: {},
      questions,
      completed: false,
      documentContext: {
        types: [],
        hasEstimate: false,
        hasPhotos: false,
        hasDenialLetter: false,
        hasAdjusterReport: false
      }
    };
  }

  /**
   * Answer a question and get next question
   */
  answerQuestion(
    flow: QuestionFlowState,
    questionId: string,
    answer: any
  ): { nextQuestion?: ContextQuestion; completed: boolean; flow: QuestionFlowState } {

    // Store answer
    flow.answers[questionId] = answer;

    // Move to next question
    flow.currentIndex++;

    // Check if completed
    if (flow.currentIndex >= flow.questions.length) {
      flow.completed = true;
      return { completed: true, flow };
    }

    // Get next question
    const nextQuestion = flow.questions[flow.currentIndex];

    return {
      nextQuestion,
      completed: false,
      flow
    };
  }

  /**
   * Get all answers from completed flow
   */
  getAnswers(flow: QuestionFlowState): Record<string, any> {
    return { ...flow.answers };
  }

  /**
   * Generate summary of answers for context
   */
  generateAnswerSummary(flow: QuestionFlowState): string {
    const lines: string[] = [];

    for (const question of flow.questions) {
      const answer = flow.answers[question.id];
      if (answer) {
        lines.push(`${question.question}`);
        lines.push(`→ ${this.formatAnswer(answer, question)}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Format answer for display
   */
  private formatAnswer(answer: any, question: ContextQuestion): string {
    if (question.type === 'multiselect' && Array.isArray(answer)) {
      return answer.join(', ');
    }

    if (typeof answer === 'object') {
      return JSON.stringify(answer);
    }

    return String(answer);
  }

  /**
   * Generate estimate-specific questions
   */
  generateEstimateQuestions(
    analysis: EstimateAnalysis,
    documentText: string
  ): ContextQuestion[] {
    const questions: ContextQuestion[] = [];

    // If low confidence, ask for clarification
    if (analysis.confidence < 0.5) {
      questions.push({
        id: 'estimate_clarity',
        question: 'The estimate appears to be unclear or incomplete. Can you provide a clearer version or describe the main items?',
        type: 'text',
        required: false,
        category: 'claim',
        helpText: 'Susan had trouble parsing this estimate due to formatting'
      });
    }

    // If no total found
    if (!analysis.totalAmount) {
      questions.push({
        id: 'estimate_total',
        question: 'What is the total amount on the estimate?',
        type: 'number',
        required: false,
        category: 'claim',
        placeholder: 'e.g., 12500.00'
      });
    }

    // If missing many code items
    if (analysis.missingCodeItems.length > 5) {
      questions.push({
        id: 'estimate_completeness',
        question: 'This estimate seems to be missing several code-required items. Is this a complete estimate or a preliminary/partial estimate?',
        type: 'choice',
        options: ['Complete estimate', 'Preliminary/partial', 'Not sure'],
        required: false,
        category: 'claim'
      });
    }

    // Ask about estimate source
    questions.push({
      id: 'estimate_source',
      question: 'Who created this estimate?',
      type: 'choice',
      options: ['Insurance adjuster', 'Roofing contractor', 'Public adjuster', 'Other'],
      required: false,
      category: 'claim'
    });

    return questions;
  }

  /**
   * Generate photo-specific questions
   */
  generatePhotoQuestions(
    documents: ProcessedDocument[]
  ): ContextQuestion[] {
    const photoCount = documents.filter(d => d.fileType === 'image').length;

    if (photoCount === 0) return [];

    const questions: ContextQuestion[] = [];

    questions.push({
      id: 'photo_location',
      question: `You uploaded ${photoCount} photo${photoCount > 1 ? 's' : ''}. What areas of the roof do these photos show?`,
      type: 'multiselect',
      options: [
        'Overall roof',
        'Damaged areas',
        'Ridge/peaks',
        'Valleys',
        'Eaves/gutters',
        'Flashing',
        'Interior damage/leaks',
        'Other'
      ],
      required: false,
      category: 'damage'
    });

    questions.push({
      id: 'photo_timing',
      question: 'When were these photos taken?',
      type: 'choice',
      options: [
        'Immediately after storm',
        'Within a week of storm',
        'More than a week after',
        'Recent (not related to specific storm)'
      ],
      required: false,
      category: 'damage'
    });

    return questions;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const questionGenerator = new DocumentQuestionGenerator();
export default questionGenerator;
