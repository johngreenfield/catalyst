    /**
     * Copies the given text to the clipboard, using the modern Clipboard API
     * with a fallback to the older `execCommand` for insecure contexts or older browsers.
     * @param {string} text The text to copy.
     * @returns {Promise<void>} A promise that resolves on success and rejects on failure.
     */
    export async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // Modern async clipboard API in a secure context.
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or insecure contexts (like http://).
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed'; // Make it invisible.
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((res, rej) => {
                try {
                    document.execCommand('copy') ? res() : rej(new Error('Copy command failed.'));
                } catch (error) {
                    rej(error);
                } finally {
                    document.body.removeChild(textArea);
                }
            });
        }
    }