<?php
// api/breakdown_task.php
header('Content-Type: application/json');
include 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$userPrompt = $input['prompt'] ?? '';

if (empty($userPrompt)) {
    echo json_encode(['error' => 'No prompt provided.']);
    exit;
}

$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => $userPrompt]
            ]
        ]
    ]
];

$ch = curl_init(GEMINI_API_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    error_log("Gemini API Error: HTTP Code " . $httpCode . ", Response: " . $response);
    echo json_encode(['error' => 'Failed to communicate with Gemini API.', 'details' => json_decode($response, true)]);
    exit;
}

$responseData = json_decode($response, true);
$generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Could not generate response.';

echo json_encode(['result' => $generatedText]);
?>