# Photo Intelligence System - Documentation

## Overview

The Photo Intelligence System is an AI-powered roof damage analysis platform that automatically detects damage types, calculates severity scores, identifies code violations, and generates professional assessments ready for insurance claims.

## Features

### Damage Detection
- **Hail Impact**: Circular marks, mat exposure, impact density analysis
- **Wind Damage**: Missing shingles, lifted tabs, directional patterns
- **Missing Shingles**: Underlayment exposure, gap identification
- **Granule Loss**: Asphalt exposure, accelerated aging detection
- **Flashing Issues**: Corrosion, separation, gaps
- **Age-Related Wear**: Uniform degradation patterns

### Analysis Capabilities
- **Severity Scoring**: 1-10 scale with detailed reasoning
- **Code Violation Detection**: IRC compliance, manufacturer guidelines
- **Pattern Recognition**: Storm damage vs age-related wear
- **Professional Assessments**: Claim-ready documentation
- **Batch Processing**: Analyze up to 20 photos simultaneously

## Technology Stack

### Vision AI
- **Anthropic Claude Vision API (Claude 3.5 Sonnet)**
  - Advanced image understanding
  - Detailed damage detection
  - Context-aware analysis
  - Professional-grade accuracy

### Image Processing
- **Sharp Library**
  - Feature extraction
  - Statistical analysis
  - Edge detection
  - Contrast and brightness analysis

### Roofing Expertise (Future Integration)
- **Abacus AI**
  - Domain-specific roofing knowledge
  - Expert system overlay
  - Enhanced accuracy for complex scenarios

## Installation

### Prerequisites
```bash
Node.js >= 18
Next.js 15+
TypeScript 5+
```

### Dependencies
```bash
npm install @anthropic-ai/sdk sharp
```

### Environment Configuration
Add to `.env.local`:
```env
# Anthropic Claude Vision API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Get your key from: https://console.anthropic.com/
```

## File Structure

```
/lib/photo-intelligence.ts          # Core analysis engine
/app/api/photo/analyze/route.ts     # Single photo API endpoint
/app/api/photo/batch/route.ts       # Batch analysis API endpoint
/app/components/PhotoUpload.tsx     # UI component for photo upload
/app/photo-demo/page.tsx            # Demo and testing page
```

## API Endpoints

### Single Photo Analysis

**Endpoint:** `POST /api/photo/analyze`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `photo` (File, required): Image file to analyze
- `propertyAddress` (string, optional): Property address for report
- `claimDate` (string, optional): Date of storm/claim event
- `roofAge` (number, optional): Age of roof in years
- `hailSize` (string, optional): Hail size (e.g., "1.5\"")

**Response:**
```json
{
  "success": true,
  "photo_id": "photo_1234567890_abc123",
  "damage_detected": true,
  "detections": [
    {
      "type": "HAIL_IMPACT",
      "name": "Hail Impact",
      "confidence": 0.92,
      "indicators": ["circular impact marks", "granule displacement"],
      "evidence": {
        "impact_density": "multiple visible",
        "pattern_type": "random distribution"
      }
    }
  ],
  "severity": {
    "score": 8,
    "rating": "Significant Damage",
    "recommendation": "full_replacement",
    "explanation": "Substantial damage identified..."
  },
  "code_violations": [
    {
      "code": "IRC R905.2.8.2",
      "description": "Exposed fiberglass mat compromises weather resistance",
      "severity": "critical",
      "evidence": "Fiberglass mat exposure visible in multiple locations"
    }
  ],
  "assessment": "ROOF DAMAGE ASSESSMENT\nProperty: ...",
  "next_steps": [
    {
      "priority": "high",
      "action": "Schedule adjuster meeting",
      "details": "Significant damage identified requiring professional inspection"
    }
  ],
  "additional_photos_needed": [
    "Four sides of home (north, south, east, west)",
    "Close-up of impact marks with scale reference"
  ]
}
```

### Batch Analysis

**Endpoint:** `POST /api/photo/batch`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `photo0`, `photo1`, ... (Files, required): Multiple image files (max 20)
- `propertyAddress` (string, optional): Property address
- `claimDate` (string, optional): Date of claim
- `roofAge` (number, optional): Roof age in years
- `documentedAngles` (string, optional): Comma-separated angles (e.g., "north,south,east,west")

**Response:**
```json
{
  "success": true,
  "photos_analyzed": 5,
  "successful_analyses": 5,
  "total_damage_types": 2,
  "total_detections": 8,
  "total_violations": 3,
  "overall_severity": {
    "score": 9,
    "average": 7.8
  },
  "final_recommendation": "full_replacement",
  "batch_assessment": {
    "assessment": "COMPREHENSIVE ROOF DAMAGE ASSESSMENT...",
    "structured": { ... }
  },
  "individual_results": [ ... ],
  "coverage_complete": false,
  "missing_documentation": [
    {
      "category": "Standard Views",
      "items": ["west side of property"]
    }
  ]
}
```

## Usage Examples

### React Component Usage

```tsx
import PhotoUpload from '@/app/components/PhotoUpload';

export default function MyPage() {
  const handleAnalysisComplete = (result) => {
    console.log('Analysis complete:', result);
    // Process result...
  };

  return (
    <div>
      <PhotoUpload
        mode="single"  // or "batch"
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
}
```

### Direct API Usage

```typescript
// Single photo analysis
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('propertyAddress', '123 Main St');
formData.append('claimDate', '2025-09-15');
formData.append('roofAge', '10');
formData.append('hailSize', '1.75"');

const response = await fetch('/api/photo/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Damage detected:', result.damage_detected);
console.log('Severity score:', result.severity.score);
```

```typescript
// Batch analysis
const formData = new FormData();
photos.forEach((photo, index) => {
  formData.append(`photo${index}`, photo);
});
formData.append('propertyAddress', '123 Main St');
formData.append('documentedAngles', 'north,south,east');

const response = await fetch('/api/photo/batch', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Overall severity:', result.overall_severity.score);
console.log('Coverage complete:', result.coverage_complete);
```

### Programmatic Usage (Server-Side)

```typescript
import { photoIntelligence } from '@/lib/photo-intelligence';
import fs from 'fs';

// Single photo analysis
const imageBuffer = fs.readFileSync('path/to/photo.jpg');
const result = await photoIntelligence.analyzePhoto(imageBuffer, {
  propertyAddress: '123 Main St',
  claimDate: '2025-09-15',
  roof_age: 10,
  hail_size: '1.75"'
});

console.log('Analysis result:', result);

// Batch analysis
const photos = [
  fs.readFileSync('photo1.jpg'),
  fs.readFileSync('photo2.jpg'),
  fs.readFileSync('photo3.jpg')
];

const batchResult = await photoIntelligence.analyzeBatch(photos, {
  propertyAddress: '123 Main St',
  claimDate: '2025-09-15',
  documented_angles: ['north', 'south', 'east', 'west']
});

console.log('Batch analysis:', batchResult);
```

## Damage Types Reference

### HAIL_IMPACT
- **Indicators**: Circular impacts, random distribution, granule displacement, mat exposure
- **Severity Factors**: Impact density, mat exposure, hail size, roof age
- **Code Concerns**: IRC R905.2.8.2 (mat exposure), GAF repair threshold (8 impacts/100 sq ft)

### WIND_DAMAGE
- **Indicators**: Missing shingles, lifted tabs, torn edges, directional pattern
- **Severity Factors**: Percentage missing, underlayment exposure, water infiltration risk
- **Code Concerns**: IRC R905.2.7 (underlayment exposure)

### MISSING_SHINGLES
- **Indicators**: Exposed underlayment, visible deck, gaps in coverage
- **Severity Factors**: Total area exposed, underlayment condition, adjacent shingle condition
- **Code Concerns**: IRC R905.2.7 (proper coverage required)

### GRANULE_LOSS
- **Indicators**: Exposed asphalt, uneven color/texture, mat fibers visible
- **Severity Factors**: Percentage loss, mat exposure, roof age, storm history
- **Code Concerns**: Weather resistance compromise

### FLASHING_ISSUES
- **Indicators**: Rust/corrosion, separation, gaps, damaged caulking
- **Severity Factors**: Water infiltration risk, location criticality, extent of damage
- **Code Concerns**: IRC R903.2 (flashing integrity)

### WEAR_AND_TEAR
- **Indicators**: Uniform granule loss, curling edges, cracking, gradual degradation
- **Severity Factors**: Roof age, remaining lifespan, warranty status
- **Code Concerns**: Generally not storm-related (may not be covered)

## Severity Scoring System

### Score Ranges
- **9-10**: Critical - Immediate Action Required
- **7-8**: Significant Damage - Full Replacement Recommended
- **5-6**: Moderate Damage - Slope Replacement or Repair
- **3-4**: Minor Damage - Targeted Repairs
- **1-2**: Minimal Damage - Monitor Condition
- **0**: No Damage Detected

### Recommendations
- **full_replacement**: Complete roof replacement required
- **slope_replacement_or_repair**: Entire slope or major repair needed
- **targeted_repair**: Specific areas can be repaired
- **monitor**: Watch for progression
- **no_action**: No action needed

## Code Violations Database

### IRC R905.2.8.2
- **Description**: Exposed fiberglass mat compromises weather resistance
- **Severity**: Critical
- **Impact**: Full replacement required

### IRC R905.2.7
- **Description**: Exposed underlayment requires immediate attention
- **Severity**: Critical
- **Impact**: Water infiltration risk

### Manufacturer Guidelines (GAF)
- **Description**: Impact density exceeds repair threshold
- **Threshold**: Maximum 8 impacts per 100 sq ft
- **Impact**: Exceeding requires slope or full replacement

### IRC R903.2
- **Description**: Flashing must maintain weather-tight seal
- **Severity**: Major
- **Impact**: Replacement required with roof replacement

## Best Practices

### Photo Quality
- **Resolution**: Minimum 1920x1080 recommended
- **Lighting**: Natural daylight preferred, avoid shadows
- **Distance**: Close-ups for damage, wide shots for context
- **Focus**: Clear, sharp images (avoid blur)

### Coverage Requirements
- **Four sides**: North, south, east, west views
- **Multiple angles**: At least 3 photos showing damage
- **Close-ups**: Detailed shots of specific damage
- **Context shots**: Overall roof condition

### Analysis Tips
1. Provide property address for context
2. Include claim date if storm-related
3. Specify roof age if known
4. Note hail size from weather reports
5. Document all four sides of property
6. Take both wide and close-up shots
7. Use scale reference (coin, tape measure) for impacts

## Performance Considerations

### Single Photo Analysis
- **Average time**: 5-10 seconds
- **Max file size**: 10MB
- **Supported formats**: JPEG, PNG, WebP
- **Timeout**: 60 seconds

### Batch Analysis
- **Average time**: 30-60 seconds (for 5 photos)
- **Max photos**: 20 per batch
- **Max total size**: 200MB (10MB per photo)
- **Timeout**: 5 minutes

## Error Handling

### Common Errors
- `No photo provided`: Missing image file in request
- `File must be an image`: Invalid file type
- `Image size must be less than 10MB`: File too large
- `Maximum 20 photos allowed`: Too many files in batch
- `Anthropic API key not configured`: Missing environment variable

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-10-02T12:00:00.000Z"
}
```

## Future Enhancements

### Planned Features
- [ ] Abacus AI integration for roofing expertise overlay
- [ ] Machine learning model fine-tuning on roofing data
- [ ] Automatic impact density calculation from marked test squares
- [ ] 3D roof modeling from photos
- [ ] Weather data integration for claim validation
- [ ] Automated report generation (PDF/Word)
- [ ] Multi-language support
- [ ] Mobile app integration

### Integration Points
- **Abacus AI**: Roofing expert system for enhanced accuracy
- **Weather APIs**: Automatic hail size and storm data lookup
- **CRM Systems**: Direct integration with insurance workflows
- **Document Generation**: Automated PDF/Word report creation

## Testing

### Demo Page
Visit `/photo-demo` to access the interactive testing interface.

### Health Check Endpoints
```bash
# Single photo analysis endpoint
curl http://localhost:4000/api/photo/analyze

# Batch analysis endpoint
curl http://localhost:4000/api/photo/batch
```

### Sample Test Cases
1. **Hail damage**: Upload photo with circular impact marks
2. **Wind damage**: Upload photo showing missing shingles
3. **No damage**: Upload photo of undamaged roof
4. **Batch analysis**: Upload 3-5 photos from different angles

## Support

### Documentation
- API Reference: See above
- Component Documentation: Check TypeScript interfaces in source files
- Examples: See `/app/photo-demo/page.tsx`

### Common Issues
- **Analysis fails**: Check API key configuration in `.env.local`
- **Slow analysis**: Large images take longer, optimize before upload
- **Incorrect detections**: Ensure good photo quality and lighting
- **Missing context**: Provide property details for better results

## License

MIT License - See project root for details

## Credits

- **Vision AI**: Anthropic Claude 3.5 Sonnet
- **Image Processing**: Sharp library
- **UI Framework**: Next.js 15 + React 19
- **Domain Expertise**: Roofing industry standards and IRC building codes
