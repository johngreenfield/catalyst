// Catalyst JS API Calls
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-button');
    const toolSelector = document.getElementById('tool-selector');
    const formalizerOptions = document.getElementById('formalizer-options');
    const themeToggle = document.getElementById('theme-toggle');

    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const selectedTool = toolSelector.value;
            processPrompt(selectedTool);
        });
    }

    if (toolSelector) {
        toolSelector.addEventListener('change', () => {
            // Show the formality level dropdown only when 'Formalizer' is selected
            formalizerOptions.style.display = (toolSelector.value === 'formalizer') ? 'block' : 'none';
        });
    }

    // --- Theme Toggler Logic ---
    const htmlElement = document.documentElement;

    const setTheme = (theme) => {
        htmlElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Set initial theme on page load
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Add a listener for real-time changes in the system's color scheme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        // Only update the theme if the user hasn't made an explicit choice on the site
        if (!localStorage.getItem('theme')) {
            const newColorScheme = event.matches ? "dark" : "light";
            setTheme(newColorScheme);
        }
    });
});

async function processPrompt(tool) {
    console.log("Processing prompt...");

    const inputText = document.getElementById('prompt-input').value;
    if (!inputText) {
        alert('Please enter some text.');
        return;
    }

    document.getElementById('result-container').innerText = 'Processing prompt...';

    let endpoint = '';
    let prompt = '';

    switch (tool) {
        case 'general_assistant':
            endpoint = '/api/general_assistant.php';
            prompt = `You are a general assistant who specialises in helping neurodivergent people achieve their goals. Answer the following question: "${inputText}"`;
            break;
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
        // Todo: Add more cases for other tools
        default:
            alert('Unknown tool.');
            return;
    }

    try {
        // Todo: Show spinner, disable button
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json(); // Attempt to parse JSON response body

        if (!response.ok) {
            // Construct a more detailed error message to expose the root cause.
            let errorMessage = `Request failed with status ${response.status}.`;
            if (data && data.error) {
                // This is our custom error from the PHP script (e.g., "Failed to communicate with Gemini API.")
                errorMessage = data.error; 
                if (data.details && data.details.error && data.details.error.message) {
                    // This is the specific, actionable error message from the Gemini API itself.
                    errorMessage += ` | Details: ${data.details.error.message}`;
                }
            }
            throw new Error(errorMessage);
        }

        document.getElementById('result-container').innerText = data.result ?? 'No valid result was returned from the API.';
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result-container').innerText = 'Error processing request: ' + error.message;
    }
}