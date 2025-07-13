<?php
/**
 * Central API Handler for all Gemini-based tools.
 *
 * This script acts as a single entry point for various AI-powered features.
 * It receives a tool identifier and user text, constructs the appropriate
 * server-side prompt, communicates with the Google Gemini API, and returns
 * a structured JSON response. This centralized approach improves security,
 * maintainability, and consistency in error handling.
 */

// Set the response content type to JSON for API-like behavior.
header('Content-Type: application/json');

// Include the centralized Gemini API helper functions.
include_once 'gemini_helper.php';

try {
    // --- Input Validation ---
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('The provided request is not valid JSON.', 400);
    }

    $tool = $input['tool'] ?? '';
    $text = $input['text'] ?? '';

    if (empty($tool) || empty($text)) {
        throw new Exception('Required parameters "tool" or "text" are missing.', 400);
    }

    // --- Prompt Construction ---
    $prompt = '';
    switch ($tool) {
        case 'general_assistant':
            $prompt = "You are a general assistant who specialises in helping neurodivergent people achieve their goals. Answer the following question: \"{$text}\"";
            break;
        case 'task_breakdown':
            $prompt = "Break down the following task into small, manageable steps, with time estimates in minutes: \"{$text}\"";
            break;
        case 'tone_analysis':
            $prompt = "Analyze the tone of the following text and suggest how it might be perceived: \"{$text}\"";
            break;
        case 'formalizer':
            $formality = $input['formality'] ?? 'more formal';
            // Basic sanitization to prevent unexpected values
            $allowedFormalities = ['more formal', 'more casual', 'like a pirate'];
            if (!in_array($formality, $allowedFormalities, true)) {
                $formality = 'more formal'; // Default to a safe value
            }
            $prompt = "Rephrase the following text to be {$formality}: \"{$text}\"";
            break;
        case 'meal_muse':
            $prompt = "Take the following list of ingredients and suggest a recipie that uses these ingredients: \"{$text}\"";
            break;
        default:
            throw new Exception("Invalid tool '{$tool}' specified.", 400);
    }

    // --- API Call and Response ---
    $responseData = callGeminiApi($prompt);

    $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Could not extract a valid response from the API result.';

    echo json_encode(['result' => $generatedText]);

} catch (GeminiApiException $e) {
    // Handle specific API errors from the helper
    http_response_code($e->getCode());
    echo json_encode(['error' => $e->getMessage(), 'details' => $e->getDetails()]);
} catch (Throwable $e) {
    // Catch any other general errors
    $httpCode = is_int($e->getCode()) && $e->getCode() > 0 ? $e->getCode() : 500;
    http_response_code($httpCode);
    echo json_encode(['error' => $e->getMessage()]);
}