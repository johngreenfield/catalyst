<?php
// api/analyze_tone.php
header('Content-Type: application/json');
include_once 'gemini_helper.php'; // Use the new helper

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('The provided request is not valid JSON.', 400);
    }

    $userPrompt = $input['prompt'] ?? '';
    if (empty($userPrompt)) {
        throw new Exception('No prompt provided.', 400);
    }

    // Call the centralized API function
    $responseData = callGeminiApi($userPrompt);

    $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Could not extract a valid response from the API result.';

    echo json_encode(['result' => $generatedText]);
} catch (GeminiApiException $e) {
    // Handle specific API errors from our helper
    http_response_code($e->getCode());
    echo json_encode(['error' => $e->getMessage(), 'details' => $e->getDetails()]);
} catch (Throwable $e) { // Catch all throwable errors, not just Exceptions.
    // Handle other errors (e.g., bad JSON, missing prompt)
    $httpCode = is_int($e->getCode()) && $e->getCode() > 0 ? $e->getCode() : 500;
    http_response_code($httpCode);
    echo json_encode(['error' => $e->getMessage()]);
}