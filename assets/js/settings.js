/**
 * Initializes all functionality related to the settings modal.
 * @param {bootstrap.Modal} settingsModal The Bootstrap modal instance.
 */
export function initializeSettings(settingsModal) {
    /**
     * Holds the user-provided API key for the current session.
     * It is intentionally not stored in localStorage for security.
     * @type {string}
     */
    let sessionApiKey = '';

    // Make the key accessible to other modules via a getter function.
    window.getSessionApiKey = () => sessionApiKey;


    // --- DOM Element References ---
    const settingsModalEl = document.getElementById('settingsModal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleApiKeyVisibilityButton = document.getElementById('toggleApiKeyVisibility');
    const modelSelector = document.getElementById('modelSelector');
    const languagePreference = document.getElementById('languagePreference');
    const typingEffectToggle = document.getElementById('typingEffectToggle');

    // Populates the settings modal with values from localStorage.
    const loadSettings = () => {
        if (apiKeyInput) {
            apiKeyInput.value = sessionApiKey;
        }
        if (modelSelector) {
            modelSelector.value = localStorage.getItem('model') || 'gemini-2.5-flash-lite-preview';
        }
        if (languagePreference) {
            const savedLang = localStorage.getItem('language');
            languagePreference.value = savedLang || (navigator.language === 'en-US' ? 'en-US' : 'en-GB');
        }
        if (typingEffectToggle) {
            // Default to 'true' (enabled) if not set.
            typingEffectToggle.checked = localStorage.getItem('typingEffectEnabled') !== 'false';
        }
    };

    // Saves the current values from the settings modal to localStorage.
    const saveSettings = () => {
        if (apiKeyInput) {
            sessionApiKey = apiKeyInput.value.trim();
        }
        if (modelSelector) {
            localStorage.setItem('model', modelSelector.value);
        }
        if (languagePreference) {
            localStorage.setItem('language', languagePreference.value);
        }
        if (typingEffectToggle) {
            // Save the state of the typing effect toggle.
            localStorage.setItem('typingEffectEnabled', typingEffectToggle.checked);
        }

        if (settingsModal) {
            settingsModal.hide();
        }
    };

    if (settingsModalEl) {
        settingsModalEl.addEventListener('show.bs.modal', loadSettings);
    }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveSettings);
    }

    if (toggleApiKeyVisibilityButton && apiKeyInput) {
        toggleApiKeyVisibilityButton.addEventListener('click', () => {
            const icon = toggleApiKeyVisibilityButton.querySelector('i');
            const isPassword = apiKeyInput.type === 'password';
            apiKeyInput.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('bi-eye', !isPassword);
            icon.classList.toggle('bi-eye-slash', isPassword);
        });
    }
}