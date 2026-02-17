// ============================================
// INOVOID — Theme Toggle (Dark / Light)
// ============================================

(function initTheme() {
    const saved = localStorage.getItem('inovoid-theme');
    if (saved === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
})();

function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    localStorage.setItem('inovoid-theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('inovoid-theme', theme);
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    // Update all theme toggle icons on the page
    document.querySelectorAll('[data-theme-icon]').forEach(icon => {
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
    document.querySelectorAll('[data-theme-label]').forEach(label => {
        label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
    // Update theme toggle buttons (settings page)
    const lightBtn = document.getElementById('light-btn');
    const darkBtn = document.getElementById('dark-btn');
    if (lightBtn && darkBtn) {
        const activeClass = 'w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white shadow-lg transition-all';
        const inactiveClass = 'w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all';
        lightBtn.className = isDark ? inactiveClass : activeClass;
        darkBtn.className = isDark ? activeClass : inactiveClass;
    }
}

// Update icons on page load
document.addEventListener('DOMContentLoaded', updateThemeIcons);
