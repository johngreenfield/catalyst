/**
 * Initializes all functionality related to the settings modal.
 * @param {bootstrap.Modal} settingsModal The Bootstrap modal instance.
 */
export function initializeSettings(settingsModal) {
    const settingsModalEl = document.getElementById('settingsModal');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleApiKeyVisibilityButton = document.getElementById('toggleApiKeyVisibility');
    const modelSelector = document.getElementById('modelSelector');
    const languagePreference = document.getElementById('languagePreference');

    const loadSettings = () => {
        if (apiKeyInput) {
            apiKeyInput.value = localStorage.getItem('apiKey') || '';
        }
        if (modelSelector) {
            modelSelector.value = localStorage.getItem('model') || 'gemini-2.5-flash-lite-preview';
        }
        if (languagePreference) {
            const savedLang = localStorage.getItem('language');
            languagePreference.value = savedLang || (navigator.language === 'en-US' ? 'en-US' : 'en-GB');
        }
    };

    const saveSettings = () => {
        if (apiKeyInput && modelSelector && languagePreference) {
            localStorage.setItem('apiKey', apiKeyInput.value.trim());
            localStorage.setItem('model', modelSelector.value);
            localStorage.setItem('language', languagePreference.value);
            if (settingsModal) {
                settingsModal.hide();
            }
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