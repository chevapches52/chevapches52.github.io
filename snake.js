class Snake {
    constructor() {
        this.grid = Array(20).fill().map(() => Array(20).fill(0));
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('snakeHighscore')) || 0;
        this.gameInterval = null;
        this.isGameStarted = false;
        this.snakeColor = localStorage.getItem('snakeColor') || '#4CAF50';
        this.foodColor = localStorage.getItem('foodColor') || '#f44336';
        this.init();
    }

    init() {
        this.grid = Array(20).fill().map(() => Array(20).fill(0));
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.isGameStarted = false;
        this.updateScore();
        this.createGrid();
        this.setupEventListeners();
        
        // Показываем/скрываем соответствующие кнопки
        document.getElementById('startSnake').style.display = 'block';
        document.getElementById('restartSnake').style.display = 'none';
        
        // Очищаем предыдущий интервал, если есть
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.render(); // Отображаем начальное положение змеи
        this.setupColorPickers();
        this.applyColors();
    }

    createGrid() {
        const container = document.querySelector('.snake-grid');
        container.innerHTML = '';
        
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                const cell = document.createElement('div');
                cell.className = 'snake-cell';
                cell.dataset.x = j;
                cell.dataset.y = i;
                container.appendChild(cell);
            }
        }
    }

    spawnFood() {
        const emptyCells = [];
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                if (!this.snake.some(segment => segment.x === j && segment.y === i)) {
                    emptyCells.push({x: j, y: i});
                }
            }
        }
        if (emptyCells.length) {
            this.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    }

    update() {
        const head = {...this.snake[0]};
        this.direction = this.nextDirection;

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check collision with walls
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
            this.gameOver();
            return;
        }

        // Check collision with self
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check if food is eaten
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.updateScore();
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.render();
    }

    render() {
        // Clear all special cells
        document.querySelectorAll('.snake-cell').forEach(cell => {
            cell.classList.remove('snake', 'food');
        });

        // Render snake
        this.snake.forEach(segment => {
            const cell = document.querySelector(
                `.snake-cell[data-x="${segment.x}"][data-y="${segment.y}"]`
            );
            if (cell) cell.classList.add('snake');
        });

        // Render food
        if (this.food) {
            const foodCell = document.querySelector(
                `.snake-cell[data-x="${this.food.x}"][data-y="${this.food.y}"]`
            );
            if (foodCell) foodCell.classList.add('food');
        }
    }

    start() {
        if (!this.isGameStarted) {
            this.isGameStarted = true;
            this.spawnFood();
            document.getElementById('startSnake').style.display = 'none';
            document.getElementById('restartSnake').style.display = 'block';
            this.gameInterval = setInterval(() => this.update(), 150);
        }
    }

    gameOver() {
        this.isGameStarted = false;
        clearInterval(this.gameInterval);
        const modal = document.getElementById('gameOverModal');
        const scoreText = document.getElementById('gameOverScore');
        let message = `Вы набрали ${this.score} очков!`;
        
        if (this.score > this.highscore) {
            message += '\nНовый рекорд!';
        }
        
        scoreText.textContent = message;
        modal.style.display = 'flex';

        const button = modal.querySelector('.modal-button');
        button.onclick = () => {
            modal.style.display = 'none';
            this.init();
        };
    }

    updateScore() {
        document.getElementById('scoreSnake').textContent = this.score;
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('snakeHighscore', this.highscore);
            document.getElementById('highscoreSnake').textContent = this.highscore;
        }
    }

    setupEventListeners() {
        // Добавляем обработчик для кнопки старта
        document.getElementById('startSnake').addEventListener('click', () => {
            this.start();
        });

        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('snake').classList.contains('active')) return;
            if (!this.isGameStarted && e.key.startsWith('Arrow')) {
                this.start(); // Автоматически начинаем игру при нажатии стрелки
                return;
            }

            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
            }
        });

        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.classList[1]; // up, down, left, right
                if ((direction === 'up' && this.direction !== 'down') ||
                    (direction === 'down' && this.direction !== 'up') ||
                    (direction === 'left' && this.direction !== 'right') ||
                    (direction === 'right' && this.direction !== 'left')) {
                    this.nextDirection = direction;
                }
            });
        });

        document.getElementById('restartSnake').addEventListener('click', () => {
            this.init();
        });
    }

    setupColorPickers() {
        const snakeColorSelect = document.getElementById('snakeColor');
        const foodColorSelect = document.getElementById('foodColor');

        // Устанавливаем сохраненные значения
        snakeColorSelect.value = this.snakeColor;
        foodColorSelect.value = this.foodColor;

        snakeColorSelect.addEventListener('change', (e) => {
            this.snakeColor = e.target.value;
            localStorage.setItem('snakeColor', this.snakeColor);
            this.applyColors();
        });

        foodColorSelect.addEventListener('change', (e) => {
            this.foodColor = e.target.value;
            localStorage.setItem('foodColor', this.foodColor);
            this.applyColors();
        });
    }

    applyColors() {
        document.documentElement.style.setProperty('--custom-snake-color', this.snakeColor);
        document.documentElement.style.setProperty('--custom-food-color', this.foodColor);
    }
} 