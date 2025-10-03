/**
 * Vision Analysis Service
 *
 * Cost-effective vision analysis using Hugging Face Inference API
 * Designed for roofing damage detection and document image analysis
 *
 * PRICING:
 * - FREE tier: 30,000 requests/month
 * - Paid tier: $0.00006 per request (~$6 per 100K images)
 *
 * MODELS USED:
 * 1. Salesforce/blip-image-captioning-large - General vision understanding
 * 2. facebook/detr-resnet-50 - Object detection
 * 3. google/vit-base-patch16-224 - Image classification
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VisionAnalysisResult {
  success: boolean;
  timestamp: string;

  // Core analysis
  description: string;
  confidence: number;

  // Detected objects/features
  objects?: DetectedObject[];
  classification?: Classification[];

  // Roofing-specific
  is_roof_image: boolean;
  damage_indicators: string[];
  materials_detected?: string[];

  // Metadata
  model_used: string;
  processing_time_ms: number;

  // Error handling
  error?: string;
  fallback_used?: boolean;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Classification {
  label: string;
  confidence: number;
}

export interface VisionServiceConfig {
  huggingface_api_key: string;
  timeout_ms?: number;
  max_retries?: number;
  fallback_to_statistical?: boolean;
}

// ============================================================================
// HUGGING FACE VISION SERVICE
// ============================================================================

export class HuggingFaceVisionService {
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;
  private fallbackEnabled: boolean;

  private readonly MODELS = {
    image_captioning: 'Salesforce/blip-image-captioning-large',
    object_detection: 'facebook/detr-resnet-50',
    image_classification: 'google/vit-base-patch16-224'
  };

  private readonly API_BASE = 'https://api-inference.huggingface.co/models';

  constructor(config: VisionServiceConfig) {
    this.apiKey = config.huggingface_api_key;
    this.timeout = config.timeout_ms || 30000; // 30 seconds default
    this.maxRetries = config.max_retries || 2;
    this.fallbackEnabled = config.fallback_to_statistical ?? true;
  }

  /**
   * Analyze image for roofing damage
   * Primary method for photo intelligence system
   */
  async analyzeRoofImage(imageBuffer: Buffer): Promise<VisionAnalysisResult> {
    const startTime = Date.now();

    console.log('[HuggingFace Vision] Starting roof image analysis...');

    try {
      // Step 1: Get image caption (main description)
      const caption = await this.getImageCaption(imageBuffer);
      console.log('[HuggingFace Vision] Caption:', caption.description);

      // Step 2: Validate this is actually a roof image
      const isRoofImage = this.validateRoofImage(caption.description);

      if (!isRoofImage) {
        console.log('[HuggingFace Vision] WARNING: Image does not appear to be a roof');
        return {
          success: false,
          timestamp: new Date().toISOString(),
          description: caption.description,
          confidence: 0,
          is_roof_image: false,
          damage_indicators: [],
          model_used: this.MODELS.image_captioning,
          processing_time_ms: Date.now() - startTime,
          error: 'Image does not appear to be a roof. Please upload photos of roofs or buildings.'
        };
      }

      // Step 3: Detect objects for more detailed analysis
      let objects: DetectedObject[] = [];
      try {
        objects = await this.detectObjects(imageBuffer);
        console.log('[HuggingFace Vision] Detected', objects.length, 'objects');
      } catch (error: any) {
        console.warn('[HuggingFace Vision] Object detection failed:', error.message);
        // Continue without object detection
      }

      // Step 4: Extract damage indicators
      const damageIndicators = this.extractDamageIndicators(caption.description, objects);
      console.log('[HuggingFace Vision] Damage indicators:', damageIndicators);

      // Step 5: Detect materials
      const materials = this.detectMaterials(caption.description, objects);
      console.log('[HuggingFace Vision] Materials detected:', materials);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        description: caption.description,
        confidence: caption.confidence,
        objects: objects,
        is_roof_image: true,
        damage_indicators: damageIndicators,
        materials_detected: materials,
        model_used: this.MODELS.image_captioning,
        processing_time_ms: processingTime
      };

    } catch (error: any) {
      console.error('[HuggingFace Vision] Analysis failed:', error);

      // Fallback to statistical analysis if enabled
      if (this.fallbackEnabled) {
        console.log('[HuggingFace Vision] Using fallback statistical analysis');
        return {
          success: true,
          timestamp: new Date().toISOString(),
          description: 'Vision API unavailable - using statistical analysis',
          confidence: 0.5,
          is_roof_image: true, // Assume valid for fallback
          damage_indicators: [],
          model_used: 'fallback-statistical',
          processing_time_ms: Date.now() - startTime,
          fallback_used: true
        };
      }

      return {
        success: false,
        timestamp: new Date().toISOString(),
        description: '',
        confidence: 0,
        is_roof_image: false,
        damage_indicators: [],
        model_used: 'none',
        processing_time_ms: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Get image caption using BLIP model
   */
  private async getImageCaption(imageBuffer: Buffer): Promise<{ description: string; confidence: number }> {
    const url = `${this.API_BASE}/${this.MODELS.image_captioning}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[HuggingFace Vision] Caption attempt ${attempt}/${this.maxRetries}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/octet-stream'
          },
          body: imageBuffer as any, // Buffer is valid BodyInit in Node.js environment
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          const errorText = await response.text();

          // Handle model loading state
          if (response.status === 503 || errorText.includes('loading')) {
            console.log('[HuggingFace Vision] Model is loading, waiting...');
            await this.sleep(10000 * attempt); // Wait 10s, 20s, 30s
            continue;
          }

          throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // BLIP returns array: [{ generated_text: "..." }]
        if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
          return {
            description: result[0].generated_text,
            confidence: 0.85 // BLIP is generally reliable
          };
        }

        throw new Error('Invalid response format from Hugging Face');

      } catch (error: any) {
        console.error(`[HuggingFace Vision] Attempt ${attempt} failed:`, error.message);
        lastError = error;

        if (attempt < this.maxRetries) {
          await this.sleep(2000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Caption generation failed');
  }

  /**
   * Detect objects in image using DETR model
   */
  private async detectObjects(imageBuffer: Buffer): Promise<DetectedObject[]> {
    const url = `${this.API_BASE}/${this.MODELS.object_detection}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        body: imageBuffer as any, // Buffer is valid BodyInit in Node.js environment
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();

        // If model is loading, skip object detection
        if (response.status === 503 || errorText.includes('loading')) {
          console.log('[HuggingFace Vision] Object detection model loading, skipping...');
          return [];
        }

        throw new Error(`Object detection failed: ${response.status}`);
      }

      const result = await response.json();

      // DETR returns: [{ label: "...", score: 0.9, box: {...} }]
      if (Array.isArray(result)) {
        return result
          .filter((obj: any) => obj.score > 0.5) // Only confident detections
          .map((obj: any) => ({
            label: obj.label,
            confidence: obj.score,
            bbox: obj.box ? {
              x: obj.box.xmin,
              y: obj.box.ymin,
              width: obj.box.xmax - obj.box.xmin,
              height: obj.box.ymax - obj.box.ymin
            } : undefined
          }));
      }

      return [];

    } catch (error: any) {
      console.warn('[HuggingFace Vision] Object detection error:', error.message);
      return []; // Non-critical, return empty array
    }
  }

  /**
   * Validate that the image is actually a roof
   */
  private validateRoofImage(description: string): boolean {
    const lowerDesc = description.toLowerCase();

    // Positive indicators - image IS a roof
    const roofKeywords = [
      'roof', 'roofing', 'shingle', 'shingles', 'tile', 'tiles',
      'building', 'house', 'home', 'structure', 'residential',
      'chimney', 'gutter', 'flashing', 'ridge', 'valley',
      'architectural', 'exterior', 'top of building'
    ];

    // Negative indicators - image is NOT a roof
    const nonRoofKeywords = [
      'person', 'people', 'face', 'portrait', 'selfie',
      'dog', 'cat', 'animal', 'pet',
      'car', 'vehicle', 'automobile',
      'food', 'meal', 'dinner', 'lunch',
      'indoor', 'inside', 'interior',
      'screen', 'computer', 'phone', 'laptop'
    ];

    // Check for non-roof indicators first (high confidence rejection)
    const hasNonRoofKeyword = nonRoofKeywords.some(kw => lowerDesc.includes(kw));
    if (hasNonRoofKeyword) {
      return false;
    }

    // Check for roof indicators
    const hasRoofKeyword = roofKeywords.some(kw => lowerDesc.includes(kw));
    if (hasRoofKeyword) {
      return true;
    }

    // If no clear indicators, be lenient and allow
    // (statistical analysis will still work)
    return true;
  }

  /**
   * Extract damage indicators from description and objects
   */
  private extractDamageIndicators(description: string, objects: DetectedObject[]): string[] {
    const indicators: string[] = [];
    const lowerDesc = description.toLowerCase();

    // Damage keywords
    const damageKeywords = {
      'hail': ['hail', 'impact', 'dent', 'circular mark', 'bruising'],
      'wind': ['wind', 'missing', 'blown', 'lifted', 'torn', 'displaced'],
      'granule loss': ['granule', 'bare', 'bald', 'exposed', 'worn'],
      'crack': ['crack', 'split', 'break', 'fracture'],
      'rust': ['rust', 'corrosion', 'corroded', 'oxidation'],
      'wear': ['old', 'worn', 'aged', 'deterioration', 'weathered']
    };

    // Check description for damage keywords
    for (const [damageType, keywords] of Object.entries(damageKeywords)) {
      if (keywords.some(kw => lowerDesc.includes(kw))) {
        indicators.push(damageType);
      }
    }

    // Check objects for damage-related items
    objects.forEach(obj => {
      const objLabel = obj.label.toLowerCase();
      if (objLabel.includes('damage') || objLabel.includes('broken') || objLabel.includes('crack')) {
        indicators.push(`detected: ${obj.label}`);
      }
    });

    return [...new Set(indicators)]; // Remove duplicates
  }

  /**
   * Detect roofing materials from description and objects
   */
  private detectMaterials(description: string, objects: DetectedObject[]): string[] {
    const materials: string[] = [];
    const lowerDesc = description.toLowerCase();

    const materialKeywords = {
      'asphalt shingles': ['asphalt', 'shingle', 'composition'],
      'metal': ['metal', 'steel', 'aluminum', 'tin'],
      'tile': ['tile', 'clay', 'concrete tile'],
      'wood': ['wood', 'shake', 'cedar'],
      'flat roof': ['flat', 'membrane', 'tpo', 'epdm']
    };

    for (const [material, keywords] of Object.entries(materialKeywords)) {
      if (keywords.some(kw => lowerDesc.includes(kw))) {
        materials.push(material);
      }
    }

    // Check objects
    objects.forEach(obj => {
      const objLabel = obj.label.toLowerCase();
      if (objLabel.includes('metal') || objLabel.includes('tile')) {
        materials.push(obj.label);
      }
    });

    return [...new Set(materials)];
  }

  /**
   * Sleep helper for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create vision service instance from environment variables
 */
export function createVisionService(): HuggingFaceVisionService | null {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    console.warn('[Vision Service] HUGGINGFACE_API_KEY not configured - vision analysis disabled');
    return null;
  }

  return new HuggingFaceVisionService({
    huggingface_api_key: apiKey,
    timeout_ms: 30000,
    max_retries: 3,
    fallback_to_statistical: true
  });
}

// Export singleton instance (created on first use)
let visionServiceInstance: HuggingFaceVisionService | null | undefined = undefined;

export function getVisionService(): HuggingFaceVisionService | null {
  if (visionServiceInstance === undefined) {
    visionServiceInstance = createVisionService();
  }
  return visionServiceInstance;
}

export default HuggingFaceVisionService;
