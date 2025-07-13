/**
 * Initializes all keyboard shortcuts for the application.
 * @param {bootstrap.Modal} helpModal The Bootstrap modal instance for the help dialog.
 * @param {bootstrap.Modal} settingsModal The Bootstrap modal instance for the settings dialog.
 */
export function initializeShortcuts(helpModal, settingsModal) {
    const promptInput = document.getElementById('prompt-input');
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');

    document.addEventListener('keydown', (event) => {
        // This should not trigger if the user is already typing in an input field.
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

        // Shortcut to focus the prompt input: Press "/"
        if (event.key === '/' && !isTyping) {
            event.preventDefault(); // Prevent the "/" character from being typed.
            if (promptInput) {
                promptInput.focus();
            }
        }

        // Shortcut to open the help modal: Press "?"
        if (event.key === '?' && !isTyping) {
            event.preventDefault(); // Prevent the "?" character from being typed.
            if (helpModal) {
                helpModal.show();
            }
        }

        // Shortcut to open settings modal: Press Ctrl+, or Cmd+,
        if (event.key === ',' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault(); // Prevent default browser action (if any).
            if (settingsModal) {
                settingsModal.show();
            }
        }

        // Shortcut to submit the form: Press Ctrl+Enter or Cmd+Enter
        // This should only trigger when the prompt input is focused.
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            if (document.activeElement === promptInput) {
                event.preventDefault(); // Prevent the default newline action in the textarea.
                if (submitButton) {
                    submitButton.click(); // Programmatically click the submit button.
                }
            }
        }

        // Shortcut to clear the prompt input: Press Escape
        // This should only trigger when the prompt input is focused.
        if (event.key === 'Escape' && document.activeElement === promptInput) {
            event.preventDefault(); // Prevent any other 'Escape' behavior like closing modals.
            if (clearButton) {
                clearButton.click();
            }
        }
    });
}