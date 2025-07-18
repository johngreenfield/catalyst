/**
 *  --- Catalyst App Client Scripts --- 
 * Author: John Greenfield
 * Website: https://johngreenfield.dev/catalyst/
 * Github: https://github.com/johngreenfield/catalyst
 * Version: 0.7
 */

import { updateSubmitButtonText, updatePromptPlaceholder, clearStream } from './ui-helpers.js';
import { initializeTheme } from './theme.js';
import { initializeSettings } from './settings.js';
import { initializeShortcuts } from './shortcuts.js';
import { processPrompt } from './api.js';
import { copyToClipboard } from './clipboard.js';

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
          spoonsOptions = document.getElementById('spoons-options'),
          formalizerOptions = document.getElementById('formalizer-options'),
          promptInput = document.getElementById('prompt-input'),
          helpModalEl = document.getElementById('helpModal'),
          settingsModalEl = document.getElementById('settingsModal');

    let helpModal;
    let settingsModal;

    /**
     * A helper function to add the 'spoons' value to a payload.
     */
    const addSpoonsToPayload = (payload) => {
        payload.spoons = document.getElementById('spoons-select').value;
    };

    /**
     * A map of tool-specific functions to modify the API payload.
     * This provides a clean, extensible way to handle tool-specific options.
     */
    const toolPayloadModifiers = {
        formalizer: (payload) => (payload.formality = document.getElementById('formalityLevel').value),
        time_estimator: addSpoonsToPayload,
        task_breakdown: addSpoonsToPayload,
        meal_muse: addSpoonsToPayload,
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
                    spoonsOptions.style.display = 'none';
                    break;
            case 'time_estimator':
                case 'task_breakdown':
                case 'meal_muse':
                    spoonsOptions.style.display = 'block';
                    formalizerOptions.style.display = 'none';
                    break;
                default:
                    spoonsOptions.style.display = 'none';
                    formalizerOptions.style.display = 'none';
                    break;
            }
            
            // Update ARIA attribute to inform assistive tech that the select controls another element.
            toolSelector.setAttribute('aria-expanded', isFormalizer || isSpoonsApplicable);
            // Dynamically update the submit button text to match the selected tool.
            updateSubmitButtonText(selectedTool);
            updatePromptPlaceholder(selectedTool);
        }
    });
    
    // Set initial state on page load.
    updateSubmitButtonText(toolSelector.value);
    updatePromptPlaceholder(toolSelector.value);
    
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