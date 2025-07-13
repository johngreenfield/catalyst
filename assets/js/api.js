/**
 * Handles all communication with the backend API.
 */

import { streamText, clearStream } from './ui-helpers.js';

/**
 * Main function to handle the API request based on the selected tool.
 * It sends the user's input to the backend and displays the result.
 * @param {string} tool The identifier for the selected tool (e.g., 'task_breakdown').
 */
export async function processPrompt(tool) {
    const apiKey = localStorage.getItem('apiKey');
    const model = localStorage.getItem('model') || 'gemini-2.5-flash-lite-preview';
    const language = localStorage.getItem('language') || 'en-GB';

    const submitButton = document.getElementById('submit-button');
    const spinner = submitButton.querySelector('.spinner-border');
    const inputText = document.getElementById('prompt-input').value;
    const resultContainer = document.getElementById('result-container');
    const copyButton = document.getElementById('copy-result-button');
    const clearButton = document.getElementById('clear-button');
    const stopButton = document.getElementById('stop-button');

    clearStream(); // At the start of a new prompt, clear any ongoing stream.

    // Hide the copy button at the start of a new prompt.
    if (copyButton) {
        copyButton.style.display = 'none';
    }

    if (!inputText) {
        alert('Please enter some text.');
        return;
    }

    // Clean up the raw text data attribute from the previous run.
    if (resultContainer.dataset.rawText) {
        delete resultContainer.dataset.rawText;
    }

    // --- Start loading state ---
    submitButton.disabled = true;
    clearButton.disabled = true;
    stopButton.style.display = 'inline-block';
    spinner.classList.remove('d-none');
    resultContainer.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="min-height: 100px;">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`;

    // --- API Call Logic ---
    const endpoint = '/api/gemini/handler.php';
    const payload = { tool, text: inputText, model, language };

    if (tool === 'formalizer') {
        payload.formality = document.getElementById('formalityLevel').value;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || `Request failed with status ${response.status}`;
            const errorDetails = data.details ? `<br><small>Details: ${JSON.stringify(data.details)}</small>` : '';
            throw new Error(errorMessage + errorDetails);
        }

        if (data.result) {
            await streamText(resultContainer, data.result, 40);
            // Show copy button only if there was a valid result from the API
            if (copyButton) {
                copyButton.style.display = 'block';
            }
        } else {
            resultContainer.innerText = 'No valid result was returned from the API.';
        }
    } catch (error) {
        console.error('Error:', error);
        let alertMessage = '';
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            alertMessage = `<div class="alert alert-warning" role="alert"><strong>Network Error:</strong> Could not connect to the server. Please check your internet connection.</div>`;
        } else {
            alertMessage = `<div class="alert alert-danger" role="alert"><strong>An error occurred:</strong><br>${error.message}</div>`;
        }
        resultContainer.innerHTML = alertMessage;
    } finally {
        // --- End loading state ---
        submitButton.disabled = false;
        clearButton.disabled = false;
        stopButton.style.display = 'none';
        spinner.classList.add('d-none');
    }
}