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
    }
    buttonTextSpan.textContent = buttonText;
}

/**
 * Simulates a word-by-word streaming effect for the result text.
 * @param {HTMLElement} element The container element to display the text in.
 * @param {string} text The full text to stream.
 * @param {number} [speed=40] The delay in milliseconds between each part.
 * @returns {Promise<void>} A promise that resolves when the streaming is complete.
 */
export function streamText(element, text, speed = 40) {
    return new Promise(resolve => {
        clearStream(); // This will also clear any lingering `streamResolve`
        streamResolve = resolve; // Store the new resolve function
        element.dataset.rawText = text; // Store the original markdown text for copying

        const typingEffectEnabled = localStorage.getItem('typingEffectEnabled') !== 'false';

        if (!typingEffectEnabled) {
            // If typing effect is disabled, display the full text immediately.
            // The `marked` library is loaded from a CDN in index.html.
            element.innerHTML = marked.parse(text);
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
                element.innerHTML = marked.parse(currentText);
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