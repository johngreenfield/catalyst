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
// IMPORTANT: This assumes `callGeminiApi` in the helper is updated to accept ($prompt, $apiKey, $model).
include_once 'gemini_helper.php';
// Use @include_once to prevent fatal errors if config.php doesn't exist.
// This file should define a constant like: define('GEMINI_API_KEY', 'your_fallback_api_key');
@include_once 'config.php';

// --- Determine API Key ---
$apiKey = null;
// 1. Check for user-provided key in Authorization header
if (isset($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
    $apiKey = $matches[1];
} 
// 2. Fallback to the key from config.php if it's defined
else if (defined('GEMINI_API_KEY')) {
    $apiKey = GEMINI_API_KEY;
}

try {
    // --- Input Validation ---
    if (empty($apiKey)) {
        // If after all checks, no API key is available, throw an error.
        throw new Exception('API key is not configured. Please provide one in the settings or configure a fallback key on the server.', 401); // Unauthorized
    }
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('The provided request is not valid JSON.', 400);
    }

    $tool = $input['tool'] ?? '';
    $text = $input['text'] ?? '';
    $model = $input['model'] ?? 'gemini-2.5-flash-lite-preview';
    $language = $input['language'] ?? 'en-GB';
    $languageName = ($language === 'en-US') ? 'US English' : 'British English';

    if (empty($tool) || empty($text)) {
        throw new Exception('Required parameters "tool" or "text" are missing.', 400);
    }

    // --- Prompt Construction ---
    $prompt = '';
    switch ($tool) {
        case 'general_assistant':
            $prompt = "You are a general assistant who specialises in helping neurodivergent people achieve their goals. Answer the following question in {$languageName}: \"{$text}\"";
            break;
        case 'task_breakdown':
            $prompt = "Break down the following task into small, manageable steps, with time estimates in minutes. Use {$languageName} for any descriptive text: \"{$text}\"";
            break;
        case 'tone_analysis':
            $prompt = "Analyze the tone of the following text and suggest how it might be perceived. Offer helpful suggestions. Provide the analysis in {$languageName}: \"{$text}\"";
            break;
        case 'formalizer':
            $formality = $input['formality'] ?? 'more formal';
            // Basic sanitization to prevent unexpected values
            $allowedFormalities = ['more formal', 'more casual', 'like a pirate'];
            if (!in_array($formality, $allowedFormalities, true)) {
                $formality = 'more formal'; // Default to a safe value if invalid input is provided
            }
            $prompt = "Rephrase the following text to be {$formality}. The rephrased text should be in {$languageName}: \"{$text}\"";
            break;
        case 'meal_muse':
            $prompt = "Take the following list of ingredients and suggest a recipe that uses these ingredients. The recipe should be written in {$languageName}: \"{$text}\"";
            break;
        default:
            throw new Exception("Invalid tool '{$tool}' specified.", 400);
    }

    // Prepend a system instruction to guide the model's output style.
    $systemInstruction = <<<EOT
<system_instructions>
  <persona>
    You are Catalyst, a friendly, encouraging, and non-judgmental AI assistant. Your primary goal is to help users, especially those with executive function challenges, by making tasks and information more manageable.
  </persona>
  <rules>
    - Always be direct and get straight to the point.
    - Use Markdown formatting (like lists, bold text, and italics) to make your responses clear and easy to read.
    - NEVER mention the language you are writing in (e.g., "British English") unless the user's prompt explicitly asks about language.
  </rules>
</system_instructions>
EOT;
    $prompt = $systemInstruction . "\n\n---\n\nUser Prompt:\n" . $prompt;

    // --- API Call and Response ---
    // Append snapshot date from config only if it's defined and the model is the specific preview version.
    $fullModelName = (defined('MODEL_SNAPSHOT_DATE') && $model === 'gemini-2.5-flash-lite-preview') ? $model . MODEL_SNAPSHOT_DATE : $model;

    // Pass the determined API key and model to the helper function.
    $responseData = callGeminiApi($prompt, $apiKey, $fullModelName);

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