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
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');
    const toolSelector = document.getElementById('tool-selector');
    const scrollToBottomButton = document.getElementById('scroll-to-bottom-button');
    const stopButton = document.getElementById('stop-button');
    const resultContainer = document.getElementById('result-container');
    const copyButton = document.getElementById('copy-result-button');
    const formalizerOptions = document.getElementById('formalizer-options');
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
            resultContainer.classList.remove('is-placeholder');
            processPrompt(selectedTool);
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

    if (toolSelector) {
        toolSelector.addEventListener('change', () => {
            const selectedTool = toolSelector.value;
            const isFormalizer = selectedTool === 'formalizer';
            // Toggles the visibility of the formality level dropdown.
            formalizerOptions.style.display = isFormalizer ? 'block' : 'none';
            // Update ARIA attribute to inform assistive tech that the select controls another element.
            toolSelector.setAttribute('aria-expanded', isFormalizer);
            // Dynamically update the submit button text to match the selected tool.
            updateSubmitButtonText(selectedTool);
        });
        // Set initial state on page load.
        toolSelector.setAttribute('aria-expanded', toolSelector.value === 'formalizer');
        updateSubmitButtonText(toolSelector.value);
    }

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