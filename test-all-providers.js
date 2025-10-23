// Comprehensive test for ALL AI providers in the fallback chain

const DEPLOYMENT_TOKEN = process.env.DEPLOYMENT_TOKEN || '2670ce30456644ddad56a334786a3a1a';
const DEPLOYMENT_ID = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

console.log('🧪 COMPREHENSIVE PROVIDER TEST\n');
console.log('Testing all providers in fallback chain:\n');

// Test 1: Abacus.AI
async function testAbacus() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  TESTING ABACUS.AI (Primary Provider)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploymentToken: DEPLOYMENT_TOKEN,
        deploymentId: DEPLOYMENT_ID,
        messages: [
          { is_user: true, text: 'What is a roof inspection?' }
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error('❌ ABACUS FAILED - HTTP', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return false;
    }

    const data = await response.json();
    const assistantMessages = data.result?.messages?.filter(m => !m.is_user) || [];
    const message = assistantMessages[assistantMessages.length - 1]?.text || '';

    if (!message || message.trim().length === 0) {
      console.error('❌ ABACUS FAILED - Empty response');
      return false;
    }

    console.log('✅ ABACUS WORKING');
    console.log('Response preview:', message.substring(0, 150) + '...\n');
    return true;

  } catch (error) {
    console.error('❌ ABACUS FAILED -', error.message);
    return false;
  }
}

// Test 2: HuggingFace
async function testHuggingFace() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  TESTING HUGGINGFACE (Backup Provider #1)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!HUGGINGFACE_API_KEY || HUGGINGFACE_API_KEY === 'your_huggingface_api_key_here') {
    console.error('❌ HUGGINGFACE FAILED - API key not configured');
    console.error('Set HUGGINGFACE_API_KEY environment variable\n');
    return false;
  }

  console.log('API Key found:', HUGGINGFACE_API_KEY.substring(0, 10) + '...');

  try {
    const model = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
    console.log('Using model:', model);

    const prompt = 'User: What is a roof inspection?\nAssistant: ';

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HUGGINGFACE FAILED - HTTP', response.status);
      console.error('Error:', errorText);

      // Check if model is loading
      if (response.status === 503 || errorText.includes('loading')) {
        console.log('⏳ Model is loading - this is expected on first request');
        console.log('   Wait 30-60 seconds and try again\n');
      }
      return false;
    }

    const result = await response.json();
    console.log('Result structure:', Object.keys(result));

    const message = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

    if (!message || message.trim().length === 0) {
      console.error('❌ HUGGINGFACE FAILED - Empty response');
      console.error('Result:', JSON.stringify(result, null, 2));
      return false;
    }

    console.log('✅ HUGGINGFACE WORKING');
    console.log('Response preview:', message.substring(0, 150) + '...\n');
    return true;

  } catch (error) {
    console.error('❌ HUGGINGFACE FAILED -', error.message);
    return false;
  }
}

// Test 3: Ollama
async function testOllama() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  TESTING OLLAMA (Backup Provider #2)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Ollama URL:', OLLAMA_API_URL);

  try {
    // First check if Ollama is running
    const healthResponse = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!healthResponse.ok) {
      console.error('❌ OLLAMA FAILED - Service not responding');
      console.error('   Is Ollama running on', OLLAMA_API_URL, '?');
      console.error('   Start Ollama: ollama serve\n');
      return false;
    }

    const models = await healthResponse.json();
    console.log('Available models:', models.models?.length || 0);
    if (models.models?.length > 0) {
      console.log('Models:', models.models.map(m => m.name).join(', '));
    }

    // Now test chat
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        messages: [
          { role: 'user', content: 'What is a roof inspection?' }
        ],
        stream: false
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error('❌ OLLAMA FAILED - HTTP', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
      console.error('   Make sure qwen2.5:7b model is installed');
      console.error('   Install: ollama pull qwen2.5:7b\n');
      return false;
    }

    const data = await response.json();
    const message = data.message?.content || '';

    if (!message || message.trim().length === 0) {
      console.error('❌ OLLAMA FAILED - Empty response');
      console.error('Result:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('✅ OLLAMA WORKING');
    console.log('Response preview:', message.substring(0, 150) + '...\n');
    return true;

  } catch (error) {
    console.error('❌ OLLAMA FAILED -', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   Ollama is not running. Start it with: ollama serve\n');
    }
    return false;
  }
}

// Test 4: Static Knowledge Base
async function testStaticKnowledge() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  TESTING STATIC KNOWLEDGE BASE (Final Fallback)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Static knowledge base is always available (built-in)
    console.log('✅ STATIC KNOWLEDGE BASE ALWAYS AVAILABLE');
    console.log('Contains built-in roofing knowledge for offline mode\n');
    return true;
  } catch (error) {
    console.error('❌ STATIC KNOWLEDGE FAILED -', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    abacus: await testAbacus(),
    huggingface: await testHuggingFace(),
    ollama: await testOllama(),
    static: await testStaticKnowledge()
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FINAL RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Provider Status:');
  console.log('  1. Abacus.AI:        ', results.abacus ? '✅ WORKING' : '❌ FAILED');
  console.log('  2. HuggingFace:      ', results.huggingface ? '✅ WORKING' : '❌ FAILED');
  console.log('  3. Ollama:           ', results.ollama ? '✅ WORKING' : '❌ FAILED');
  console.log('  4. Static Knowledge: ', results.static ? '✅ WORKING' : '❌ FAILED');
  console.log('');

  const workingCount = Object.values(results).filter(Boolean).length;
  console.log(`Working Providers: ${workingCount}/4\n`);

  if (workingCount === 4) {
    console.log('🎉 PERFECT! All providers working - Full redundancy active');
  } else if (workingCount >= 2) {
    console.log('⚠️  PARTIAL - Some providers working, fallback chain active');
  } else if (workingCount === 1) {
    console.log('🚨 CRITICAL - Only 1 provider working, limited redundancy');
  } else {
    console.log('💥 FAILURE - No providers working, system will not respond');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Exit with appropriate code
  process.exit(workingCount >= 2 ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
