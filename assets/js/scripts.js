/**
 *  --- Catalyst App Client Scripts --- 
 * Author: John Greenfield
 * Website: https://johngreenfield.dev/catalyst/
 * Version: 0.3
 */

/**
 * Main entry point for the application's client-side logic.
 * This function sets up all initial event listeners and page state once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-button');
    const toolSelector = document.getElementById('tool-selector');
    const formalizerOptions = document.getElementById('formalizer-options');
    const themeToggle = document.getElementById('theme-toggle');
    const promptInput = document.getElementById('prompt-input');
    const helpModalEl = document.getElementById('helpModal');
    const settingsModalEl = document.getElementById('settingsModal');
    let helpModal;
    let settingsModal;

    if (helpModalEl) {
        helpModal = new bootstrap.Modal(helpModalEl);
    }

    if (settingsModalEl) {
        settingsModal = new bootstrap.Modal(settingsModalEl);
    }

    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const selectedTool = toolSelector.value;
            processPrompt(selectedTool);
        });
    }

    if (toolSelector) {
        toolSelector.addEventListener('change', () => {
            const selectedTool = toolSelector.value;
            // Toggles the visibility of the formality level dropdown based on the selected tool.
            formalizerOptions.style.display = (selectedTool === 'formalizer') ? 'block' : 'none';
            // Dynamically update the submit button text to match the selected tool.
            updateSubmitButtonText(selectedTool);
        });
        // Set initial button text on page load.
        updateSubmitButtonText(toolSelector.value);
    }

    // --- Theme Toggler Logic ---
    const htmlElement = document.documentElement;
    
    /**
     * Sets the application's color theme.
     * It updates the `data-bs-theme` attribute on the <html> element,
     * saves the preference to localStorage, and syncs the theme toggle switch.
     * @param {string} theme The theme to set, either 'dark' or 'light'.
     */
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

    // Set initial theme on page load, respecting user's system preference as a fallback.
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Add a listener for real-time changes in the system's color scheme preference.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        // Only update the theme if the user hasn't already made an explicit choice on the site.
        if (!localStorage.getItem('theme')) {
            const newColorScheme = event.matches ? "dark" : "light";
            setTheme(newColorScheme);
        }
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (event) => {
        // Shortcut to focus the prompt input: Press "/"
        // This should not trigger if the user is already typing in an input field.
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (event.key === '/' && !isTyping) {
            event.preventDefault(); // Prevent the "/" character from being typed.
            if (promptInput) {
                promptInput.focus();
            }
        }

        // Shortcut to open the help modal: Press "?"
        if (event.key === '?' && !isTyping) {
            event.preventDefault(); // Prevent the "?" character from being typed.
            if (helpModal) {
                helpModal.show();
            }
        }

        // Shortcut to open settings modal: Press Ctrl+, or Cmd+,
        if (event.key === ',' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault(); // Prevent default browser action (if any).
            if (settingsModal) {
                settingsModal.show();
            }
        }

        // Shortcut to submit the form: Press Ctrl+Enter or Cmd+Enter
        // This should only trigger when the prompt input is focused.
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            if (document.activeElement === promptInput) {
                event.preventDefault(); // Prevent the default newline action in the textarea.
                if (submitButton) {
                    submitButton.click(); // Programmatically click the submit button.
                }
            }
        }
    });
});

/**
 * Updates the text of the submit button to be more descriptive of the selected tool's action.
 * @param {string} tool The identifier for the selected tool (e.g., 'task_breakdown').
 */
const updateSubmitButtonText = (tool) => {
    const buttonTextSpan = document.querySelector('#submit-button .button-text');
    if (!buttonTextSpan) return;

    let buttonText = 'Process Text'; // Default text
    switch (tool) {
        case 'general_assistant':
            buttonText = 'Ask Assistant';
            break;
        case 'task_breakdown':
            buttonText = 'Break it Down';
            break;
        case 'tone_analysis':
            buttonText = 'Analyze Tone';
            break;
        case 'formalizer':
            buttonText = 'Rephrase Text';
            break;
        case 'meal_muse':
            buttonText = 'Suggest Recipe';
            break;
    }
    buttonTextSpan.textContent = buttonText;
};

// --- Catalyst JS API Calls --- 

/**
 * Main function to handle the API request based on the selected tool.
 * It constructs the appropriate prompt, sends it to the backend endpoint,
 * and displays the result or an error message.
 * @param {string} tool The identifier for the selected tool (e.g., 'task_breakdown').
 */
async function processPrompt(tool) {
    console.log("Processing prompt...");

    const submitButton = document.getElementById('submit-button');
    const spinner = submitButton.querySelector('.spinner-border');
    const inputText = document.getElementById('prompt-input').value;
    const resultContainer = document.getElementById('result-container');

    if (!inputText) {
        alert('Please enter some text.');
        return;
    }

    // --- Start loading state ---
    // Disable the button and show the spinner to indicate processing.
    submitButton.disabled = true;
    spinner.classList.remove('d-none');
    resultContainer.innerText = 'Processing...';

    // --- API Call Logic ---
    let endpoint = '';
    let prompt = '';

    // Construct the API endpoint and prompt based on the selected tool.
    switch (tool) {
        case 'general_assistant':
            endpoint = '/api/gemini/general_assistant.php';
            prompt = `You are a general assistant who specialises in helping neurodivergent people achieve their goals. Answer the following question: "${inputText}"`;
            break;
        case 'task_breakdown':
            endpoint = '/api/gemini/breakdown_task.php';
            prompt = `Break down the following task into small, manageable steps, with time estimates in minutes: "${inputText}"`;
            break;
        case 'tone_analysis':
            endpoint = '/api/gemini/analyze_tone.php';
            prompt = `Analyze the tone of the following text and suggest how it might be perceived: "${inputText}"`;
            break;
        case 'formalizer':
            const formality = document.getElementById('formalityLevel').value;
            endpoint = '/api/gemini/formalize_text.php';
            prompt = `Rephrase the following text to be ${formality}: "${inputText}"`;
            break;
        case 'meal_muse':
            endpoint = '/api/gemini/meal_muse.php';
            prompt = `Take the following list of ingredients and suggest a recipie that uses these ingredients: "${inputText}"`;
            break;
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

        resultContainer.innerText = data.result ?? 'No valid result was returned from the API.';
    } catch (error) {
        console.error('Error:', error);
        resultContainer.innerText = 'Error processing request: ' + error.message;
    } finally {
        // --- End loading state ---
        // This block will run whether the request succeeds or fails.
        // Re-enable the button and hide the spinner.
        submitButton.disabled = false;
        spinner.classList.add('d-none');
    }
}