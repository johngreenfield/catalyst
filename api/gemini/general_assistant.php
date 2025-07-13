<?php
/**
 * API Endpoint for the "General Assistant" feature.
 *
 * This script receives a prompt from the user, sends it to the Google Gemini API
 * to generate a response as a general assistant, and returns the generated text
 * as a JSON response.
 */

// Set the response content type to JSON for API-like behavior.
header('Content-Type: application/json');

// Include the centralized Gemini API helper functions.
include_once 'gemini_helper.php';

try {
    // --- Input Validation ---

    // Get the raw POST data from the request.
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    // Check if the provided input is valid JSON.
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('The provided request is not valid JSON.', 400);
    }

    // Extract the prompt from the JSON payload and ensure it's not empty.
    $userPrompt = $input['prompt'] ?? '';
    if (empty($userPrompt)) {
        throw new Exception('No prompt provided.', 400);
    }

    // --- API Call and Response ---

    // Call the centralized API function with the user's prompt.
    $responseData = callGeminiApi($userPrompt);

    // Safely extract the generated text from the API response.
    // Provides a fallback message if the expected structure is not found.
    $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Could not extract a valid response from the API result.';

    // Send the successful response back to the client.
    echo json_encode(['result' => $generatedText]);
} catch (GeminiApiException $e) {
    // Handle specific API errors thrown by the gemini_helper.
    http_response_code($e->getCode());
    echo json_encode(['error' => $e->getMessage(), 'details' => $e->getDetails()]);
} catch (Throwable $e) {
    // Catch any other general errors (e.g., bad JSON, missing prompt).
    // Ensure a valid HTTP status code is set, defaulting to 500.
    $httpCode = is_int($e->getCode()) && $e->getCode() > 0 ? $e->getCode() : 500;
    http_response_code($httpCode);
    echo json_encode(['error' => $e->getMessage()]);
}