/**
 *  --- Catalyst App Client Scripts --- 
 * Author: John Greenfield
 * Website: https://johngreenfield.dev/catalyst/
 * Version: 0.5
 */

import { updateSubmitButtonText, streamText, clearStream } from './ui-helpers.js';
import { initializeTheme } from './theme.js';
import { initializeSettings } from './settings.js';
import { initializeShortcuts } from './shortcuts.js';
import { processPrompt } from './api.js';

/**
 * Main entry point for the application's client-side logic.
 * This function sets up all initial event listeners and page state once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const submitButton = document.getElementById('submit-button'),
          clearButton = document.getElementById('clear-button'),
          toolSelector = document.getElementById('tool-selector'),
          scrollToBottomButton = document.getElementById('scroll-to-bottom-button'),
          stopButton = document.getElementById('stop-button'),
          resultContainer = document.getElementById('result-container'),
          copyButton = document.getElementById('copy-result-button'),
          timeEstimatorOptions = document.getElementById('time-estimator-options'),
          formalizerOptions = document.getElementById('formalizer-options'),
          promptInput = document.getElementById('prompt-input'),
          helpModalEl = document.getElementById('helpModal'),
          settingsModalEl = document.getElementById('settingsModal');

    let helpModal;
    let settingsModal;

    /**
     * A map of tool-specific functions to modify the API payload.
     * This provides a clean, extensible way to handle tool-specific options.
     */
    const toolPayloadModifiers = {
        formalizer: (payload) => {
            payload.formality = document.getElementById('formalityLevel').value;
        },
        time_estimator: (payload) => {
            payload.spoons = document.getElementById('spoons-select').value;
        },
        task_breakdown: (payload) => {
            payload.spoons = document.getElementById('spoons-select').value;
        },
        meal_muse: (payload) => {
            payload.spoons = document.getElementById('spoons-select').value;
        },
    };

    if (helpModalEl) {
        helpModal = new bootstrap.Modal(helpModalEl);
    }

    if (settingsModalEl) {
        settingsModal = new bootstrap.Modal(settingsModalEl);
    }

    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const selectedTool = toolSelector.value;
            resultContainer.classList.remove('is-placeholder');

            if (promptInput.value.length > 2000) { // Example: 2000 character limit
                alert('Prompt is too long. Please limit your input to 2000 characters.');
                return;
            }
            
            // Prepare the payload object with common and tool-specific parameters
            const payload = {
                tool: selectedTool,
                text: promptInput.value,
            };
             // Apply tool-specific modifications, if any
            if (toolPayloadModifiers[selectedTool]) {
                toolPayloadModifiers[selectedTool](payload);
            }           
            processPrompt(payload);
        });
    }

    if (stopButton) {
        stopButton.addEventListener('click', () => {
            clearStream();
            // The `finally` block in processPrompt will handle resetting the UI.
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            clearStream();

            if (promptInput) {
                promptInput.value = '';
                promptInput.focus(); // Focus the input for a better user experience.
            }
            if (resultContainer) {
                resultContainer.innerHTML = ''; // Clear previous results
                resultContainer.classList.add('is-placeholder');
                if (resultContainer.dataset.rawText) {
                    delete resultContainer.dataset.rawText;
                }
            }
            // Hide the copy button when the results are cleared.
            if (copyButton) {
                copyButton.style.display = 'none';
            }
            // Hide the scroll-to-bottom button as well
            if (scrollToBottomButton) {
                scrollToBottomButton.classList.remove('show');
            }
        });
    }

    /**
     * Copies the given text to the clipboard, using the modern Clipboard API
     * with a fallback to the older `execCommand` for insecure contexts or older browsers.
     * @param {string} text The text to copy.
     * @returns {Promise<void>} A promise that resolves on success and rejects on failure.
     */
    async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // Modern async clipboard API in a secure context.
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or insecure contexts (like http://).
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed'; // Make it invisible.
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((res, rej) => {
                try {
                    document.execCommand('copy') ? res() : rej(new Error('Copy command failed.'));
                } catch (error) {
                    rej(error);
                } finally {
                    document.body.removeChild(textArea);
                }
            });
        }
    }

    if (copyButton && resultContainer) {
        copyButton.addEventListener('click', async () => {
            // Copy the raw markdown from the data attribute, not the rendered innerText.
            const textToCopy = resultContainer.dataset.rawText || resultContainer.innerText;

            if (!textToCopy || textToCopy.trim() === '') {
                return; // Don't copy placeholder text
            }
            try {
                await copyToClipboard(textToCopy);
                // --- Success UI feedback ---
                const icon = copyButton.querySelector('i');
                copyButton.setAttribute('data-original-icon-class', icon.className);

                icon.className = 'bi bi-check-lg';
                copyButton.classList.add('btn-success');
                copyButton.classList.remove('btn-outline-secondary');
                copyButton.setAttribute('title', 'Copied!');

                setTimeout(() => {
                    icon.className = copyButton.getAttribute('data-original-icon-class');
                    copyButton.classList.remove('btn-success');
                    copyButton.classList.add('btn-outline-secondary');
                    copyButton.setAttribute('title', 'Copy to clipboard');
                }, 2000);
            } catch (err) {
                // --- Failure UI feedback ---
                console.error('Failed to copy text: ', err);
                copyButton.setAttribute('title', 'Copy failed!');
            }
        });
    }

    // Attach a single 'change' listener to the document for event delegation.
    document.addEventListener('change', (event) => {
        if (event.target === toolSelector) {
            const selectedTool = toolSelector.value; // Read the current value here
            const isSpoonsApplicable = ['time_estimator', 'task_breakdown', 'meal_muse'].includes(selectedTool);
            const isFormalizer = selectedTool === 'formalizer';

            switch (selectedTool) {
                case 'formalizer':
                    formalizerOptions.style.display = 'block';
                    timeEstimatorOptions.style.display = 'none';
                    break;
                case 'time_estimator':
                case 'task_breakdown':
                case 'meal_muse':
                    timeEstimatorOptions.style.display = 'block';
                    formalizerOptions.style.display = 'none';
                    break;
                default:
                    timeEstimatorOptions.style.display = 'none';
                    formalizerOptions.style.display = 'none';
                    break;
            }
            
            // Update ARIA attribute to inform assistive tech that the select controls another element.
            toolSelector.setAttribute('aria-expanded', isFormalizer || isSpoonsApplicable);
            // Dynamically update the submit button text to match the selected tool.
            updateSubmitButtonText(selectedTool);
        }
    });
    
    // Set initial state on page load.
    updateSubmitButtonText(toolSelector.value);

    // --- Scroll-to-Bottom Button Logic ---
    if (scrollToBottomButton && resultContainer) {
        const checkScrollButtonVisibility = () => {
            const scrollThreshold = 10; // A small pixel threshold
            const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - scrollThreshold;
            const hasResults = resultContainer.innerText.trim() !== '';

            if (!isAtBottom && hasResults) {
                scrollToBottomButton.classList.add('show');
            } else {
                scrollToBottomButton.classList.remove('show');
            }
        };

        // Check visibility on user scroll.
        window.addEventListener('scroll', checkScrollButtonVisibility);

        // Check visibility when the result container's size changes.
        const resizeObserver = new ResizeObserver(checkScrollButtonVisibility);
        resizeObserver.observe(resultContainer);

        // Handle the click event to scroll down and enable auto-scrolling.
        scrollToBottomButton.addEventListener('click', () => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
    }

    initializeTheme();
    initializeSettings(settingsModal);
    initializeShortcuts(helpModal, settingsModal);
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        // Log the registration object for detailed inspection
        console.log('Registration object:', registration);
      })
      .catch(err => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });
}