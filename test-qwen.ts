// test-qwen.ts
async function testConnection() {
  console.log('Testing Qwen connection...');
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:32b',
        prompt: 'Hello! Say "Working!" if you can hear me.',
        stream: false
      })
    });

    const data = await response.json();
    console.log('✅ Success!');
    console.log('Response:', data.response);
  } catch (error) {
    console.log('❌ Error:', error);
    console.log('Make sure Ollama is running with: ollama serve');
  }
}

testConnection();
