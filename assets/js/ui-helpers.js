/**
 * Contains helper functions for manipulating the user interface.
 */

let streamIntervalId = null; // To manage the text streaming interval
let streamResolve = null; // To hold the resolve function of the current stream promise

/**
 * Updates the text of the submit button to be more descriptive of the selected tool's action.
 * @param {string} tool The identifier for the selected tool (e.g., 'task_breakdown').
 */
export function updateSubmitButtonText(tool) {
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
        case 'brain_dump_organizer':
            buttonText = 'Organize Dump';
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
        case 'deep_dive':
            buttonText = 'Dive Deep';
            break;
        case 'time_estimator':
            buttonText = 'Estimate Time';
            break;
        default:
            break;
    }
    buttonTextSpan.textContent = buttonText;
}

/**
 * A map of placeholder messages for the prompt input, specific to each tool.
 */
const promptPlaceholders = {
    general_assistant: 'Ask anything... e.g., "What are the five largest cities in Spain?"',
    task_breakdown: 'Enter a large task to be broken down into smaller, manageable steps. e.g., "Plan a surprise birthday party."',
    brain_dump_organizer: 'Paste your unstructured thoughts or meeting notes, and I will organize them into a coherent summary.',
    tone_analysis: 'Enter a piece of text (like an email or a message) to analyze its tone. e.g., "I am not sure if this is the right approach."',
    formalizer: 'Enter a casual sentence or phrase to make it more formal. e.g., "Hey, can you get that thing done ASAP?"',
    meal_muse: 'List some ingredients you have, and I will suggest a recipe. e.g., "chicken breast, rice, broccoli, soy sauce"',
    deep_dive: 'Enter a topic you want to learn more about in a structured way. e.g., "The history of the internet."',
    time_estimator: 'Describe a task or a list of tasks to get a time estimate. e.g., "Write a blog post about AI, including research and editing."',
    // Default placeholder if a tool is not in this map.
    default: 'Enter your text here...'
};

/**
 * Updates the placeholder text of the prompt input based on the selected tool.
 * @param {string} tool The identifier for the selected tool.
 */
export function updatePromptPlaceholder(tool) {
    const promptInput = document.getElementById('prompt-input');
    if (!promptInput) return;

    const placeholderText = promptPlaceholders[tool] || promptPlaceholders.default;
    promptInput.setAttribute('placeholder', placeholderText);
}
/**
 * Renders text into an element. If the 'typingEffectEnabled' setting is true,
 * it simulates a word-by-word streaming effect. Otherwise, it renders the
 * full text immediately. The text is sanitized before being parsed as Markdown.
 * @param {HTMLElement} element The container element to display the text in.
 * @param {string} text The full text to stream.
 * @param {number} [speed=40] The delay in milliseconds between each part.
 * @returns {Promise<void>} A promise that resolves when the streaming is complete.
 */
const DEFAULT_STREAMING_SPEED = 40; // Milliseconds
export function streamText(element, text, speed = DEFAULT_STREAMING_SPEED) {

    return new Promise(resolve => {
        clearStream(); // This will also clear any lingering `streamResolve`
        streamResolve = resolve; // Store the new resolve function
        element.dataset.rawText = text; // Store the original markdown text for copying

        const typingEffectEnabled = localStorage.getItem('typingEffectEnabled') !== 'false';

        if (!typingEffectEnabled) {
            // If typing effect is disabled, display the full text immediately.
            // The `marked` library is loaded from a CDN in index.html.
            const cleanText = DOMPurify.sanitize(text); // Sanitize the text
            element.innerHTML = marked.parse(cleanText); // Then parse and render
            if (streamResolve) {
                streamResolve();
                streamResolve = null;
            }
            return; // Exit the function early
        }

        element.innerHTML = ''; // Use innerHTML to render markdown
        const parts = text.split(/(\s+)/); // Split by spaces/newlines but keep them
        let i = 0;
        let currentText = ''; // Keep track of the full markdown text

        streamIntervalId = setInterval(() => {
            // Check if the stream is still active before proceeding
            if (streamIntervalId && i < parts.length) {
                currentText += parts[i];
                // On each tick, parse the accumulated markdown text and render it as HTML.
                // The `marked` library is loaded from a CDN in index.html.
                const cleanCurrentText = DOMPurify.sanitize(currentText); // Sanitize
                element.innerHTML = marked.parse(cleanCurrentText); // Then parse and render
                i++;
            } else {
                clearInterval(streamIntervalId);
                streamIntervalId = null;
                if (streamResolve) {
                    streamResolve();
                    streamResolve = null;
                }
            }
        }, speed);
    });
}

/** Clears any active text streaming interval. */
export function clearStream() {
    if (streamIntervalId) {
        clearInterval(streamIntervalId);
        streamIntervalId = null;
    }
    if (streamResolve) {
        streamResolve(); // Resolve any pending promise
        streamResolve = null;
    }
}