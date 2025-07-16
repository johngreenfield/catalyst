/**
 * Handles all communication with the backend API.
 */

import { streamText, clearStream } from './ui-helpers.js';

/**
 * Manages the UI loading state by enabling/disabling buttons and showing/hiding spinners.
 * @param {boolean} isLoading - Whether to enter or exit the loading state.
 */
function setLoadingState(isLoading) {
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');
    const stopButton = document.getElementById('stop-button');
    const spinner = submitButton.querySelector('.spinner-border');
    const resultContainer = document.getElementById('result-container');

    submitButton.disabled = isLoading;
    clearButton.disabled = isLoading;
    stopButton.style.display = isLoading ? 'inline-block' : 'none';

    if (isLoading) {
        spinner.classList.remove('d-none');
        resultContainer.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="min-height: 100px;">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`;
    } else {
        spinner.classList.add('d-none');
    }
}

/**
 * Creates a base fetch request, automatically adding content-type and authorization headers.
 * @param {string} url The URL to fetch.
 * @param {object} options Standard fetch options object.
 * @returns {Promise<object>} The JSON response data.
 * @throws {Error} If the network request fails or the API returns an error.
 */
async function baseFetch(url, options = {}) {
  const apiKey = localStorage.getItem('apiKey');
  const headers = { 
    'Content-Type': 'application/json',
    ...options.headers // Allow overriding of default headers
  };
  if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
      ...options,
      headers: headers
  });

  const data = await response.json();

  if (!response.ok) {
      const errorMessage = data.error || `Request failed with status ${response.status}`;
      const errorDetails = data.details ? `<br><small>Details: ${JSON.stringify(data.details)}</small>` : ''; // Intentionally includes HTML for alert display
      throw new Error(errorMessage + errorDetails);
  }

  return data;
}


/**
 * Fetches the API response from the backend.
 * @param {object} payload - The data to send to the API.
 * @returns {Promise<string>} The result text from the API.
 * @throws {Error} If the network request fails or the API returns an error.
 */
async function fetchApiResponse(payload) {
    const data = await baseFetch('/api/gemini/handler.php', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (!data.result) {
        throw new Error('No valid result was returned from the API.');
    }

    return data.result;
}

/**
 * Main function to handle the API request based on the selected tool.
 * It orchestrates the process of getting user input, showing a loading state,
 * calling the API, and displaying the result.
 * @param {object} payload The payload object for the API request.
 * @param {string} payload.tool The identifier for the selected tool.
 * @param {string} payload.text The user's input text.
 * @param {string} [payload.formality] The formality level for the 'formalizer' tool.
 * @param {number|string} [payload.spoons] The spoon count for energy-related tools.
 */
export async function processPrompt(payload) {
    const inputText = document.getElementById('prompt-input').value;
    const resultContainer = document.getElementById('result-container');
    const copyButton = document.getElementById('copy-result-button');

    if (!inputText) {
        alert('Please enter some text.');
        return;
    }

    resultContainer.classList.remove('is-placeholder');
    resultContainer.innerHTML = '';


    // --- Prepare UI for new request ---
    clearStream();
    if (copyButton) copyButton.style.display = 'none';
    if (resultContainer.dataset.rawText) delete resultContainer.dataset.rawText;

    setLoadingState(true);

    try {
        // --- 1. Prepare API Request ---
        const model = localStorage.getItem('model') || 'gemini-2.5-flash-lite-preview';
        const language = localStorage.getItem('language') || 'en-GB';
        payload.model = model;
        payload.language = language;

        // --- 2. Make API Call ---
        const resultText = await fetchApiResponse(payload);

        // --- 3. Stream and Display Result ---
        await streamText(resultContainer, resultText, 40);

        if (copyButton) copyButton.style.display = 'block';
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
        setLoadingState(false);
    }
}