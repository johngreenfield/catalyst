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

// Set other security headers
header("X-Content-Type-Options: nosniff");

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
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

// 1. Check for user-provided key in Authorization header
if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $apiKey = $matches[1];
} 
// 2. Fallback to the key from config.php if it's defined
else if (defined('GEMINI_API_KEY')) {
    $apiKey = GEMINI_API_KEY;
    error_log("Catalyst API: Using fallback API key from config.");
} else {
    error_log("Catalyst API: No API key was found or configured.");
}

try {
    // --- Input Validation ---
    if (empty($apiKey)) {
        // Log *why* we're throwing this exception - should help identify config issues.
        if (!defined('GEMINI_API_KEY')) {
            error_log("Catalyst API: GEMINI_API_KEY constant not defined in config.php");
        }
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

    // --- Strict Input Validation ---
    // Validate 'model' against an allowlist
    $allowed_models = ['gemini-2.5-flash-lite-preview', 'gemini-2.5-flash'];
    $model = in_array($input['model'] ?? '', $allowed_models) ? $input['model'] : 'gemini-2.5-flash-lite-preview';

    // Validate 'language' against an allowlist
    $allowed_languages = ['en-GB', 'en-US'];
    $language = in_array($input['language'] ?? '', $allowed_languages) ? $input['language'] : 'en-GB';
    $languageName = ($language === 'en-US') ? 'US English' : 'British English';

    // Sanitize text input to be safe for inclusion in the prompt string
    $text = trim(filter_var($text, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH));

    if (empty($tool) || empty($text)) {
        throw new Exception('Required parameters "tool" or "text" are missing.', 400);
    }

    // --- Get Optional, Tool-Specific Parameters ---
    $spoons = (int)($input['spoons'] ?? 3); // Cast to int for safety
    $formality = $input['formality'] ?? 'more formal';
    $allowedFormalities = ['more formal', 'more casual', 'like a pirate'];
    if (!in_array($formality, $allowedFormalities, true)) {
        $formality = 'more formal'; // Default to a safe value if invalid input is provided
    }

    // --- Prompt Construction ---
    $promptBuilders = [
        'general_assistant' => fn() => "You are a general assistant who specialises in helping neurodivergent people achieve their goals. Answer the following question in {$languageName}: \"{$text}\"",
        'task_breakdown' => fn() => "Given a user with {$spoons}/3 spoons of energy, break down the following task into small, manageable steps, with estimated times (adjust estimates based on the user's energy level). Provide the response in {$languageName}: \"{$text}\"",
        'brain_dump_organizer' => fn() => "Organize the following unstructured 'brain dump' text. Parse the text to identify tasks, ideas, appointments, and other notes. Structure the output into clear, categorized lists using Markdown. Include time estimates for tasks (if discernible from the context).


Possible categories include:
- ## To-Do List (for actionable items)
- ## Ideas (for future thoughts)
- ## Appointments & Events (for scheduled items)
 - ## Notes & Reminders (for general info)\n
Prioritize the To-Do list. Do not include empty categories. The user's text is in {$languageName}: \"{$text}\"",
        'tone_analysis' => fn() => "Analyze the tone of the following text and suggest how it might be perceived. Offer helpful suggestions. Provide the analysis in {$languageName}: \"{$text}\"",
        'formalizer' => fn() => "Rephrase the following text to be {$formality}. The rephrased text should be in {$languageName}: \"{$text}\"",
        'meal_muse' => fn() => "Considering the user has {$spoons}/3 spoons of energy, suggest a simple and easy-to-prepare recipe using these ingredients (prioritize recipes requiring less effort). Provide the recipe in {$languageName}: \"{$text}\"",
        'deep_dive' => fn() => "You are a research assistant. Provide a comprehensive 'deep dive' into the following topic. The response should be well-structured with clear headings, detailed, and easy to understand for a newcomer. Provide sources where necessary. Use Markdown for formatting. The user's topic is in {$languageName}: \"{$text}\"",
        'decision_helper' => fn() => "Act as a decision-making assistant. Analyze the following decision that the user needs to make. Provide a balanced view with a 'Pros' list, a 'Cons' list, and a 'General Advice' section to help them think through the options. The user's decision is in {$languageName}: \"{$text}\"",
        'time_estimator' => function () use ($spoons, $languageName, $text) {
            $spoonFactor = max(1, 4 - $spoons); // Ensure at least a factor of 1
            return "You are a time estimator. Provide an estimated time in minutes for the following task, considering the user may have limited energy (spoons). Multiply your initial estimate by a spoon factor of {$spoonFactor}. The task is in {$languageName}: \"{$text}\"";
        }
    ];

    if (!isset($promptBuilders[$tool])) {
        throw new Exception("Invalid tool '{$tool}' specified.", 400);
    }

    $prompt = $promptBuilders[$tool]();

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
    http_response_code($e->getCode());
    echo json_encode(['error' => $e->getMessage(), 'details' => $e->getDetails()]);    
} catch (Throwable $e) {
    error_log("Catalyst Unhandled Error: " . $e->getMessage());
    // Return a generic error to the client to avoid leaking implementation details.
    $httpCode = is_int($e->getCode()) && $e->getCode() > 0 ? $e->getCode() : 500;
    http_response_code($httpCode);
    echo json_encode(['error' => 'An unexpected server error occurred.']);
}