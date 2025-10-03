# Action Buttons - Quick Reference Guide

## How to Use Action Buttons in Your Code

### Import the Action Handler

```typescript
import { actionHandler } from '@/lib/action-handlers';
```

### Import Components

```typescript
import ActionButton from '@/app/components/ActionButton';
import TemplateModal from '@/app/components/TemplateModal';
import PhotoAnalysisModal from '@/app/components/PhotoAnalysisModal';
import EmailComposerModal from '@/app/components/EmailComposerModal';
import StormVerificationModal from '@/app/components/StormVerificationModal';
import InsuranceCompanyModal from '@/app/components/InsuranceCompanyModal';
import ResultPanel, {
  TemplateResultContent,
  PhotoResultContent,
  StormResultContent
} from '@/app/components/ResultPanel';
```

---

## Quick Examples

### 1. Create a Template Generation Button

```typescript
const [showTemplateModal, setShowTemplateModal] = useState(false);
const [templateResult, setTemplateResult] = useState(null);
const [showResultPanel, setShowResultPanel] = useState(false);

// Button
<ActionButton
  type="template"
  label="Generate Template"
  icon="📄"
  variant="primary"
  onAction={() => setShowTemplateModal(true)}
/>

// Modal
<TemplateModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  onGenerated={(result) => {
    setTemplateResult(result);
    setShowResultPanel(true);
  }}
/>

// Result Panel
<ResultPanel
  isOpen={showResultPanel}
  onClose={() => setShowResultPanel(false)}
  type="template"
  title="Template Generated"
>
  <TemplateResultContent data={templateResult} />
</ResultPanel>
```

### 2. Create a Photo Analysis Button

```typescript
const [showPhotoModal, setShowPhotoModal] = useState(false);
const [photoResult, setPhotoResult] = useState(null);

<ActionButton
  type="photo"
  label="Analyze Photos"
  icon="📸"
  variant="secondary"
  onAction={() => setShowPhotoModal(true)}
/>

<PhotoAnalysisModal
  isOpen={showPhotoModal}
  onClose={() => setShowPhotoModal(false)}
  onAnalyzed={(result) => {
    setPhotoResult(result);
    setShowResultPanel(true);
  }}
/>

<ResultPanel
  isOpen={showResultPanel}
  onClose={() => setShowResultPanel(false)}
  type="photo"
  title="Photo Analysis Complete"
>
  <PhotoResultContent data={photoResult} />
</ResultPanel>
```

### 3. Create an Email Send Button

```typescript
const [showEmailModal, setShowEmailModal] = useState(false);

<ActionButton
  type="email"
  label="Send Email"
  icon="✉️"
  variant="success"
  onAction={() => setShowEmailModal(true)}
/>

<EmailComposerModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  onSent={(result) => {
    alert('Email sent successfully!');
  }}
  prefilledData={{
    to: 'adjuster@insurance.com',
    subject: 'Claim Documentation',
    body: 'Your email content here...',
  }}
/>
```

### 4. Create a Storm Verification Button

```typescript
const [showStormModal, setShowStormModal] = useState(false);

<ActionButton
  type="storm"
  label="Verify Storm"
  icon="⛈️"
  variant="warning"
  onAction={() => setShowStormModal(true)}
/>

<StormVerificationModal
  isOpen={showStormModal}
  onClose={() => setShowStormModal(false)}
  onVerified={(result) => {
    setStormResult(result);
    setShowResultPanel(true);
  }}
/>
```

### 5. Create an Insurance Company Selector

```typescript
const [showCompanyModal, setShowCompanyModal] = useState(false);
const [selectedCompany, setSelectedCompany] = useState(null);

<ActionButton
  type="company"
  label="Select Company"
  icon="🏢"
  variant="secondary"
  onAction={() => setShowCompanyModal(true)}
/>

<InsuranceCompanyModal
  isOpen={showCompanyModal}
  onClose={() => setShowCompanyModal(false)}
  onSelected={(company) => {
    setSelectedCompany(company);
    console.log('Selected:', company.name);
  }}
/>
```

### 6. Create an Export Report Button

```typescript
const [isExporting, setIsExporting] = useState(false);

<ActionButton
  type="export"
  label="Export Report"
  icon="📥"
  variant="success"
  loading={isExporting}
  onAction={async () => {
    setIsExporting(true);
    const result = await actionHandler.handleReportExport({
      sessionId: '12345',
      format: 'pdf',
      includePhotos: true,
      includeAnalysis: true,
      includeEmails: true,
    });
    setIsExporting(false);

    if (result.success) {
      alert('Report exported successfully!');
    }
  }}
/>
```

---

## Direct Action Handler Usage

### Generate Template

```typescript
const result = await actionHandler.handleTemplateGeneration({
  templateKey: 'partial_denial_appeal',
  autoDetect: false,
  variables: {
    property_address: '123 Main St',
    homeowner_name: 'John Doe',
  },
});

if (result.success) {
  console.log('Template:', result.data.document);
}
```

### Analyze Photos

```typescript
const files: File[] = [...]; // Your files

const result = await actionHandler.handlePhotoAnalysis({
  files,
  propertyAddress: '123 Main St',
  claimDate: '2025-10-01',
  roofAge: '10',
  hailSize: '1.5"',
  mode: 'batch',
});

if (result.success) {
  console.log('Detections:', result.data.detections);
}
```

### Send Email

```typescript
const result = await actionHandler.handleEmailSend({
  to: 'adjuster@insurance.com',
  subject: 'Claim Documentation',
  body: 'Email content here...',
  attachments: [{
    filename: 'report.pdf',
    content: pdfBuffer,
  }],
});

if (result.success) {
  console.log('Email sent:', result.data.messageId);
}
```

### Verify Storm

```typescript
const result = await actionHandler.handleStormVerification({
  address: '123 Main St, City, ST',
  date: '2025-09-15',
  radius: 25,
});

if (result.success) {
  console.log('Events found:', result.data.events);
}
```

### Select Company

```typescript
const result = await actionHandler.handleCompanySelection('company-123');

if (result.success) {
  console.log('Company:', result.data.name);
  console.log('Email:', result.data.contact_email);
}
```

### Export Report

```typescript
const result = await actionHandler.handleReportExport({
  sessionId: '12345',
  format: 'pdf',
  includePhotos: true,
  includeAnalysis: true,
  includeEmails: true,
});

// File downloads automatically
```

---

## ActionButton Props Reference

```typescript
interface ActionButtonProps {
  type: 'template' | 'photo' | 'email' | 'storm' | 'company' | 'export' | 'voice' | 'custom';
  label: string;                    // Button text
  icon?: ReactNode;                 // Icon (emoji or component)
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';       // Button size
  disabled?: boolean;               // Disabled state
  loading?: boolean;                // Show loading spinner
  onAction: () => Promise<void> | void;  // Action to execute
  className?: string;               // Additional CSS classes
  fullWidth?: boolean;              // Full width button
}
```

### Variant Colors
- **primary:** Red gradient (main actions)
- **secondary:** Blue gradient (secondary actions)
- **success:** Green gradient (confirmations)
- **danger:** Red gradient (destructive actions)
- **warning:** Yellow gradient (caution actions)

---

## ResultPanel Props Reference

```typescript
interface ResultPanelProps {
  isOpen: boolean;           // Panel visibility
  onClose: () => void;       // Close handler
  type: PanelType;          // Determines color scheme
  title: string;            // Panel header title
  children: ReactNode;      // Panel content
}

type PanelType = 'template' | 'photo' | 'email' | 'storm' | 'company' | 'export' | 'none';
```

---

## Common Patterns

### Pattern 1: Modal + Result Panel Flow

```typescript
// State
const [showModal, setShowModal] = useState(false);
const [result, setResult] = useState(null);
const [showResult, setShowResult] = useState(false);

// Button
<ActionButton onAction={() => setShowModal(true)} />

// Modal
<SomeModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onComplete={(data) => {
    setResult(data);
    setShowResult(true);
  }}
/>

// Result Panel
<ResultPanel
  isOpen={showResult}
  onClose={() => setShowResult(false)}
>
  <ResultContent data={result} />
</ResultPanel>
```

### Pattern 2: Direct Action Execution

```typescript
<ActionButton
  onAction={async () => {
    const result = await actionHandler.someAction();
    if (result.success) {
      alert('Success!');
    } else {
      alert('Error: ' + result.error);
    }
  }}
/>
```

### Pattern 3: Confirmation Before Action

```typescript
<ActionButton
  onAction={async () => {
    if (confirm('Are you sure?')) {
      const result = await actionHandler.someAction();
      // Handle result
    }
  }}
/>
```

---

## Error Handling Best Practices

```typescript
try {
  const result = await actionHandler.someAction();

  if (!result.success) {
    // Show user-friendly error
    setError(result.error || 'Operation failed');
    return;
  }

  // Handle success
  setData(result.data);

} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
  setError('An unexpected error occurred');
}
```

---

## Styling Tips

### Custom Button Styles

```typescript
<ActionButton
  className="my-custom-class hover:scale-110"
  // ... other props
/>
```

### Full Width Buttons

```typescript
<ActionButton
  fullWidth={true}
  // ... other props
/>
```

### Size Variations

```typescript
// Small
<ActionButton size="sm" label="Small" />

// Medium (default)
<ActionButton size="md" label="Medium" />

// Large
<ActionButton size="lg" label="Large" />
```

---

## API Endpoint Testing

### Test Email Send

```bash
curl -X POST http://localhost:4000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email",
    "repName": "John Doe"
  }'
```

### Test Storm Verification

```bash
curl -X POST http://localhost:4000/api/weather/verify-storm \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St, City, ST",
    "date": "2025-09-15",
    "radius": 25
  }'
```

### Test Insurance Companies List

```bash
curl http://localhost:4000/api/insurance/companies?search=State%20Farm
```

### Test Report Export

```bash
curl -X POST http://localhost:4000/api/report/export \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "12345",
    "format": "pdf"
  }' \
  --output report.pdf
```

---

## Troubleshooting

### Modal not opening?
- Check `isOpen` state is being set to `true`
- Verify modal component is rendered
- Check for z-index conflicts

### Action not executing?
- Check `onAction` prop is defined
- Verify action handler is imported
- Check browser console for errors

### Result panel not showing?
- Verify `isOpen` state is true
- Check result data is not null
- Ensure content component is imported

### API errors?
- Check API endpoint is running
- Verify request payload format
- Check network tab for response

---

## Performance Tips

1. **Lazy load modals** - Only render when needed
2. **Debounce search inputs** - Reduce API calls
3. **Cache results** - Store frequently used data
4. **Optimize images** - Compress before upload
5. **Use pagination** - For large lists

---

## Accessibility Checklist

- [ ] All buttons have descriptive labels
- [ ] Modals can be closed with Escape key
- [ ] Focus management in modals
- [ ] Keyboard navigation support
- [ ] ARIA labels on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Loading states announced to screen readers

---

## Quick Debugging

```typescript
// Enable debug mode in action handler
const result = await actionHandler.handleSomeAction(...);
console.log('Action result:', result);

// Check modal state
console.log('Modal open:', isModalOpen);

// Verify data
console.log('Result data:', resultData);
```

---

## Summary

This action button system provides:
- ✅ Instant action execution
- ✅ Professional UI/UX
- ✅ Consistent patterns
- ✅ Type safety
- ✅ Error handling
- ✅ Loading states
- ✅ Result displays
- ✅ Extensible architecture

**Happy coding!** 🎉
