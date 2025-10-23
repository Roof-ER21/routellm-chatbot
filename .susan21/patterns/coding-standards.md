# Coding Standards & Patterns

## TypeScript/JavaScript

### Preferred Patterns

**Import Style**
```typescript
// PREFERRED: Static imports
import { function } from './module';

// AVOID: Dynamic imports (breaks esbuild bundling)
const { function } = await import('./module');
```

**String Handling**
```typescript
// PREFERRED: Double quotes for strings with apostrophes
const message = "We're not interested";

// AVOID: Single quotes with apostrophes (syntax errors)
const message = 'We're not interested'; // ERROR
```

**Error Handling**
```typescript
// PREFERRED: Specific error types
try {
  await operation();
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network error
  }
  logger.error('Operation failed', { error });
}

// AVOID: Silent failures
try {
  await operation();
} catch {}
```

### Framework Specific

**Express.js**
```typescript
// PREFERRED: Async/await with proper error handling
app.post('/api/endpoint', async (req, res) => {
  try {
    const result = await service.process(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// INCLUDE: CORS for API endpoints
app.use(cors());
```

**React/Next.js**
```typescript
// PREFERRED: Functional components with hooks
export default function Component() {
  const [state, setState] = useState(initial);

  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  return <div>{content}</div>;
}
```

## Database Patterns

### PostgreSQL with Prisma
```typescript
// PREFERRED: Use Prisma for type safety
const users = await prisma.user.findMany({
  where: { active: true },
  include: { profile: true }
});

// CONNECTION: Always use connection pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
```

### Query Optimization
```typescript
// PREFERRED: Select only needed fields
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true }
});

// AVOID: Loading everything
const users = await prisma.user.findMany();
```

## API Design

### RESTful Endpoints
```
GET    /api/resource          - List resources
GET    /api/resource/:id      - Get single resource
POST   /api/resource          - Create resource
PUT    /api/resource/:id      - Update resource
DELETE /api/resource/:id      - Delete resource
```

### Response Format
```typescript
// SUCCESS:
{
  success: true,
  data: { ... },
  meta?: { pagination, ... }
}

// ERROR:
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE"
}
```

## Git Workflow

### Commit Messages
```
feat: Add user authentication
fix: Resolve database connection timeout
refactor: Simplify routing logic
docs: Update API documentation
test: Add integration tests for auth

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Production fixes

## Deployment

### Environment Variables
```bash
# REQUIRED: Never commit these
DATABASE_URL=
API_KEY=
SECRET_KEY=

# OPTIONAL: With defaults
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Railway Deployment
```bash
# Build succeeds locally before pushing
npm run build

# Auto-deploy on push to main
git push origin main

# Check deployment
railway logs
```

## Security

### API Keys
```typescript
// PREFERRED: Server-side only
import { apiKey } from '@/lib/config';

// NEVER: Client-side exposure
const apiKey = process.env.NEXT_PUBLIC_API_KEY;
```

### Input Validation
```typescript
// ALWAYS: Validate user input
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

const validated = schema.parse(req.body);
```

## Testing

### Unit Tests
```typescript
describe('function', () => {
  it('should handle valid input', () => {
    expect(function(validInput)).toBe(expected);
  });

  it('should throw on invalid input', () => {
    expect(() => function(invalid)).toThrow();
  });
});
```

### Integration Tests
```typescript
describe('API endpoint', () => {
  it('should return 200 on success', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```
