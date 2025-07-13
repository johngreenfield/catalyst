<?php
/**
 * Configuration for the Catalyst application's Gemini API integration.
 *
 * It is recommended to set the GEMINI_API_KEY here for development or as a fallback.
 * For production, it's more secure to use environment variables.
 */

// The base URL for the Google Gemini API.
define('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models');

// The snapshot date to append to model names. Centralizes versioning on the backend.
define('MODEL_SNAPSHOT_DATE', '-06-17');

// Fallback API Key. For this example, we'll leave it commented out.
define('GEMINI_API_KEY', 'AIzaSyDyzQC6w6AgF1uGSojRpTQjAaGQy3BIha4');