<?php
// api/gemini_helper.php

/**
 * Custom exception for handling API-specific errors from Gemini.
 */
class GeminiApiException extends Exception {
    private $details;

    public function __construct($message, $code = 0, $details = null, Throwable $previous = null) {
        parent::__construct($message, $code, $previous);
        $this->details = $details;
    }

    public function getDetails() {
        return $this->details;
    }
}

/**
 * Centralized function to call the Google Gemini API.
 *
 * @param string $prompt The user prompt to send to the API.
 * @param string $apiKey The API key for authentication.
 * @param string $model The specific Gemini model to use (e.g., 'gemini-pro').
 * @return array The decoded JSON response from the API.
 * @throws Exception If configuration is missing or cURL fails.
 * @throws GeminiApiException If the API returns an error.
 */
function callGeminiApi($prompt, $apiKey, $model) {
    // The handler is now responsible for including config and providing the key.
    // We still need the base URL from the config.
    if (!defined('GEMINI_API_URL')) {
        throw new Exception('API base URL is not configured correctly in config.php.', 500);
    }

    if (empty($apiKey) || empty($model)) {
        throw new Exception('API key or model was not provided to the API helper.', 500);
    }

    $data = [
        'contents' => [['parts' => [['text' => $prompt]]]]
    ];

    // Construct the full URL using the provided model, ensuring no double slashes.
    $full_api_url = rtrim(GEMINI_API_URL, '/') . '/' . $model . ':generateContent?key=' . $apiKey;

    $ch = curl_init($full_api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new Exception('cURL error during API communication: ' . $curlError, 500);
    }

    if ($httpCode !== 200) {
        $details = json_decode($response, true);
        // If JSON decoding fails, pass the raw response for better debugging.
        if (json_last_error() !== JSON_ERROR_NONE) {
            $details = ['raw_error_response' => $response];
        }
        throw new GeminiApiException('Failed to communicate with Gemini API.', $httpCode, $details);
    }

    $responseData = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // The API returned 200 OK but the body was not valid JSON. This is unexpected.
        throw new GeminiApiException('Received an invalid JSON response from the API.', 500, ['raw_success_response' => $response]);
    }
    return $responseData;
}