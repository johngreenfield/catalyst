// script.js
async function processText(tool) {
    const inputText = document.getElementById('inputText').value;
    if (!inputText) {
        alert('Please enter some text.');
        return;
    }

    let endpoint = '';
    let prompt = '';

    switch (tool) {
        case 'task_breakdown':
            endpoint = '/api/breakdown_task.php';
            prompt = `Break down the following task into small, manageable steps, with time estimates in minutes: "${inputText}"`;
            break;
        case 'tone_analysis':
            endpoint = '/api/analyze_tone.php';
            prompt = `Analyze the tone of the following text and suggest how it might be perceived: "${inputText}"`;
            break;
        case 'formalizer':
            const formality = document.getElementById('formalityLevel').value;
            endpoint = '/api/formalize_text.php';
            prompt = `Rephrase the following text to be ${formality}: "${inputText}"`;
            break;
        // Add more cases for other tools
        default:
            alert('Unknown tool.');
            return;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        document.getElementById('outputArea').innerText = data.result || 'No response.';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('outputArea').innerText = 'Error processing request.';
    }
}