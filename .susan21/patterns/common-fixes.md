# Common Fixes & Solutions

## Production Issues

### Railway 502 Gateway Errors

**Symptom**: Application fails to respond, 502 error in logs

**Common Causes**:
1. Dynamic imports breaking esbuild bundling
2. Port binding issues
3. Missing environment variables
4. Database connection failures

**Solutions**:

```typescript
// FIX 1: Convert dynamic imports to static
// BEFORE:
const routes = await import('./routes');

// AFTER:
import routes from './routes';
```

```typescript
// FIX 2: Ensure correct port binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

```bash
# FIX 3: Verify environment variables
railway variables list
railway variables set KEY=value
```

### esbuild Bundling Issues

**Symptom**: Dynamic imports work locally but fail in production

**Root Cause**: esbuild bundles to single file, breaking relative imports

**Solution**:
```typescript
// Convert ALL dynamic imports to static imports
// OR configure esbuild to preserve dynamic imports:

// esbuild.config.js
{
  bundle: true,
  platform: 'node',
  external: ['./dynamic-module'] // Mark as external
}
```

## Database Issues

### Connection Pool Exhaustion

**Symptom**: "Too many connections" errors

**Solution**:
```typescript
// Use connection pooling
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=10"

// Close connections properly
await prisma.$disconnect();
```

### Migration Conflicts

**Symptom**: Schema out of sync with database

**Solution**:
```bash
# Reset development database
npx prisma db push --force-reset

# For production, use migrations
npx prisma migrate deploy
```

## Ollama Integration Issues

### Model Not Loading

**Symptom**: "Model not found" errors

**Solution**:
```bash
# Check available models
ollama list

# Pull/create required model
ollama pull susan-ai-21:v4.1

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### Slow Response Times

**Symptom**: Chat responses taking >30 seconds

**Solutions**:
1. Use smaller model for faster responses
2. Reduce max_tokens in generation
3. Use streaming responses
4. Implement response caching

```typescript
// Enable streaming
const stream = await ollama.chat({
  model: 'susan-ai-21:v4.1',
  messages: messages,
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.message.content);
}
```

## Node.js Issues

### Memory Leaks

**Symptom**: Application crashes with "Out of memory"

**Solutions**:
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Monitor memory usage
node --inspect server.js
```

### Port Already in Use

**Symptom**: "EADDRINUSE" error on startup

**Solutions**:
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm start
```

## TypeScript Issues

### Type Errors in Production

**Symptom**: Runtime errors despite TypeScript compilation success

**Solution**:
```bash
# Enable strict mode
# tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

# Run type check before build
npm run type-check
```

### Module Resolution Issues

**Symptom**: Cannot find module errors

**Solution**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Git Issues

### Large File Commits

**Symptom**: Push rejected due to file size

**Solution**:
```bash
# Remove large file from history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/large/file' \
  --prune-empty --tag-name-filter cat -- --all

# Use Git LFS for large files
git lfs install
git lfs track "*.psd"
```

### Merge Conflicts

**Symptom**: Conflicts during merge/pull

**Solution**:
```bash
# Show conflicts
git status

# Resolve manually, then:
git add .
git commit -m "Resolve merge conflicts"

# Or abort merge
git merge --abort
```

## Testing Issues

### Flaky Tests

**Symptom**: Tests pass sometimes, fail other times

**Solutions**:
1. Add proper waits for async operations
2. Mock external dependencies
3. Use deterministic test data
4. Isolate test state

```typescript
// BAD: Race condition
it('should save data', async () => {
  saveData();
  const result = await loadData(); // Might run before save completes
  expect(result).toBeDefined();
});

// GOOD: Proper async handling
it('should save data', async () => {
  await saveData();
  const result = await loadData();
  expect(result).toBeDefined();
});
```

## Performance Issues

### Slow Page Loads

**Solutions**:
1. Enable compression
2. Implement caching
3. Optimize images
4. Code splitting
5. Lazy loading

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Cache static assets
app.use(express.static('public', { maxAge: '1d' }));

// Lazy load components
const Heavy = lazy(() => import('./Heavy'));
```
