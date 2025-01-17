class GameManager {
    constructor() {
        this.blockBlast = new BlockBlast();
        this.game2048 = new Game2048();
        this.snake = new Snake();
        this.doodleJump = new DoodleJump();
        this.setupTabs();
        this.setupThemeToggle();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Деактивируем все вкладки и игры
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.game').forEach(game => {
                    game.classList.remove('active');
                });
                
                // Активируем выбранную вкладку и игру
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        // Устанавливаем начальное состояние
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';

        // Обработчик переключения темы
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }
}

window.onload = () => {
    new GameManager();
}; 
