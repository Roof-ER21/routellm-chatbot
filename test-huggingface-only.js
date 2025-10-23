// Test HuggingFace provider specifically with Railway environment

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL;

console.log('🧪 TESTING HUGGINGFACE PROVIDER\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Configuration:');
console.log('  API Key:', HUGGINGFACE_API_KEY ? `${HUGGINGFACE_API_KEY.substring(0, 10)}...` : '❌ NOT SET');
console.log('  Model:', HUGGINGFACE_MODEL || '(using defaults)');
console.log('');

if (!HUGGINGFACE_API_KEY || HUGGINGFACE_API_KEY === 'your_huggingface_api_key_here') {
  console.error('❌ HUGGINGFACE_API_KEY not configured');
  console.error('   Set environment variable: HUGGINGFACE_API_KEY=hf_xxxxx\n');
  process.exit(1);
}

async function testHuggingFace() {
  // Models to test in order
  const modelsToTest = [];

  // Add configured model first if it exists
  if (HUGGINGFACE_MODEL) {
    modelsToTest.push(HUGGINGFACE_MODEL);
  }

  // Add common models
  modelsToTest.push(
    'Qwen/Qwen2.5-7B-Instruct',
    'Qwen/Qwen2.5-Coder-7B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.2',
    'microsoft/phi-2'
  );

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Testing Models:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let successCount = 0;
  const results = [];

  for (const model of modelsToTest) {
    console.log(`Testing: ${model}`);

    try {
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

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 503 || errorText.includes('loading')) {
          console.log(`  ⏳ Model loading (Status: ${response.status})`);
          console.log(`     Wait 30-60 seconds and try again`);
          results.push({ model, status: 'loading' });
        } else if (response.status === 404) {
          console.log(`  ❌ Model not found (Status: 404)`);
          results.push({ model, status: 'not_found' });
        } else {
          console.log(`  ❌ Failed (Status: ${response.status})`);
          console.log(`     Error: ${errorText.substring(0, 100)}`);
          results.push({ model, status: 'error', error: errorText.substring(0, 100) });
        }
        console.log('');
        continue;
      }

      const result = await response.json();
      const message = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

      if (!message || message.trim().length === 0) {
        console.log(`  ❌ Empty response`);
        results.push({ model, status: 'empty' });
        console.log('');
        continue;
      }

      console.log(`  ✅ SUCCESS`);
      console.log(`     Response: ${message.substring(0, 100)}...`);
      results.push({ model, status: 'success', response: message });
      successCount++;
      console.log('');

      // If configured model works, we can stop
      if (model === HUGGINGFACE_MODEL) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ CONFIGURED MODEL WORKING - Test Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        break;
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({ model, status: 'error', error: error.message });
      console.log('');
    }
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Results:');
  results.forEach(r => {
    const statusIcon = r.status === 'success' ? '✅' :
                       r.status === 'loading' ? '⏳' :
                       r.status === 'not_found' ? '❓' : '❌';
    console.log(`  ${statusIcon} ${r.model}: ${r.status.toUpperCase()}`);
  });

  console.log(`\nWorking models: ${successCount}/${results.length}`);

  if (successCount > 0) {
    console.log('\n✅ HUGGINGFACE PROVIDER OPERATIONAL');
    console.log('   At least one model is working and will be used as fallback');

    if (HUGGINGFACE_MODEL) {
      const configuredResult = results.find(r => r.model === HUGGINGFACE_MODEL);
      if (configuredResult?.status === 'success') {
        console.log(`\n✅ YOUR CONFIGURED MODEL (${HUGGINGFACE_MODEL}) IS WORKING!`);
      } else if (configuredResult?.status === 'loading') {
        console.log(`\n⏳ YOUR CONFIGURED MODEL (${HUGGINGFACE_MODEL}) IS LOADING`);
        console.log('   Wait 30-60 seconds and try again. Other models will be used meanwhile.');
      } else {
        console.log(`\n⚠️  YOUR CONFIGURED MODEL (${HUGGINGFACE_MODEL}) FAILED`);
        console.log('   Fallback models will be used instead.');
      }
    }
  } else {
    console.log('\n❌ NO MODELS WORKING');
    console.log('   Check your API key and try again');
    console.log('   Some models may be loading - wait and retry');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return successCount > 0 ? 0 : 1;
}

testHuggingFace()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
