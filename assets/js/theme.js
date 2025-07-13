/**
 * Initializes and manages the application's theme (light/dark mode).
 */
export function initializeTheme() {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');

    /**
     * Sets the application's color theme.
     * @param {string} theme The theme to set, either 'dark' or 'light'.
     */
    const setTheme = (theme) => {
        htmlElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    };

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Set initial theme on page load
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Add listener for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (!localStorage.getItem('theme')) {
            setTheme(event.matches ? "dark" : "light");
        }
    });
}

