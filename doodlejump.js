class DoodleJump {
    constructor() {
        this.canvas = document.getElementById('doodleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('doodleHighscore')) || 0;
        this.isGameStarted = false;
        this.platforms = [];
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            velocityY: 0,
            velocityX: 0,
            jumpForce: -12,
            gravity: 0.4,
            speed: 5
        };
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.score = 0;
        this.updateScore();
        this.platforms = [];
        this.generatePlatforms();
        
        // Размещаем игрока над первой платформой
        const firstPlatform = this.platforms[this.platforms.length - 1];
        this.player.x = firstPlatform.x + (firstPlatform.width - this.player.width) / 2;
        this.player.y = firstPlatform.y - this.player.height;
        this.player.velocityY = 0;
        this.player.velocityX = 0;
        
        this.setupEventListeners();
        
        // Принудительно вызываем render для отображения начального состояния
        this.render();
    }

    setupEventListeners() {
        // Управление клавиатурой
        const handleKeyDown = (e) => {
            if (!this.isGameStarted) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.start(); // Запуск игры по пробелу или Enter
                    return;
                }
            }
            if (e.key === 'ArrowLeft') this.player.velocityX = -this.player.speed;
            if (e.key === 'ArrowRight') this.player.velocityX = this.player.speed;
        };

        const handleKeyUp = (e) => {
            if (e.key === 'ArrowLeft' && this.player.velocityX < 0) this.player.velocityX = 0;
            if (e.key === 'ArrowRight' && this.player.velocityX > 0) this.player.velocityX = 0;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Обработчик кнопки старта
        const startButton = document.getElementById('startDoodle');
        startButton.addEventListener('click', () => this.start());

        // Запуск по клику на canvas
        this.canvas.addEventListener('click', () => {
            if (!this.isGameStarted) {
                this.start();
            }
        });

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            if (!this.isGameStarted) this.render();
        });

        // Сенсорное управление
        let touchStartX = null;
        const touchSensitivity = 2;

        const gameContainer = document.getElementById('doodlejump');
        
        gameContainer.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Предотвращаем скролл
            touchStartX = e.touches[0].clientX;
            
            // Запускаем игру по первому касанию
            if (!this.isGameStarted) {
                this.start();
            }
        }, { passive: false });

        gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isGameStarted || touchStartX === null) return;

            const touch = e.touches[0];
            const currentX = touch.clientX;
            const deltaX = currentX - touchStartX;
            
            // Обновляем позицию игрока на основе смещения
            this.player.velocityX = (deltaX / window.innerWidth) * this.player.speed * 15;
            
            // Обновляем начальную точку для следующего движения
            touchStartX = currentX;
        }, { passive: false });

        gameContainer.addEventListener('touchend', () => {
            touchStartX = null;
            this.player.velocityX = 0;
        });

        // Добавляем альтернативное управление через тап по сторонам экрана
        gameContainer.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            const screenMiddle = window.innerWidth / 2;
            
            if (touch.clientX < screenMiddle) {
                this.player.velocityX = -this.player.speed;
            } else {
                this.player.velocityX = this.player.speed;
            }
        });
    }

    generatePlatforms() {
        const platformCount = 7;
        const platformWidth = 70;
        const platformHeight = 20;
        
        // Первая платформа всегда под игроком
        this.platforms.push({
            x: this.canvas.width / 2 - platformWidth / 2,
            y: this.canvas.height - 100,
            width: platformWidth,
            height: platformHeight
        });
        
        // Остальные платформы
        for (let i = 1; i < platformCount; i++) {
            this.platforms.push({
                x: Math.random() * (this.canvas.width - platformWidth),
                y: (this.canvas.height / platformCount) * i,
                width: platformWidth,
                height: platformHeight
            });
        }
    }

    checkCollision(platform) {
        return this.player.velocityY > 0 && 
               this.player.x + this.player.width > platform.x &&
               this.player.x < platform.x + platform.width &&
               this.player.y + this.player.height > platform.y &&
               this.player.y + this.player.height < platform.y + platform.height + 10; // Увеличили зону коллизии
    }

    update() {
        // Обновление позиции игрока
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;
        this.player.x += this.player.velocityX;

        // Проверка границ экрана по горизонтали
        if (this.player.x + this.player.width < 0) {
            this.player.x = this.canvas.width;
        } else if (this.player.x > this.canvas.width) {
            this.player.x = -this.player.width;
        }

        // Проверка столкновений с платформами
        let hasCollided = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                this.player.y = platform.y - this.player.height;
                this.player.velocityY = this.player.jumpForce;
                hasCollided = true;
            }
        });

        // Прокрутка экрана вверх
        if (this.player.y < this.canvas.height / 2) {
            const diff = this.canvas.height / 2 - this.player.y;
            this.player.y = this.canvas.height / 2;
            
            this.score += Math.floor(diff);
            this.updateScore();
            
            this.platforms.forEach(platform => {
                platform.y += diff;
                if (platform.y > this.canvas.height) {
                    platform.y = 0;
                    platform.x = Math.random() * (this.canvas.width - platform.width);
                }
            });
        }

        // Проверка проигрыша
        if (this.player.y > this.canvas.height) {
            this.gameOver();
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (window.innerWidth <= 420) {
            this.canvas.width = container.clientWidth - 30; // Отступ для мобильных
            this.canvas.height = window.innerHeight * 0.7;
        } else {
            this.canvas.width = 400;
            this.canvas.height = 600;
        }
        
        // Перерисовываем всё после изменения размера
        if (this.platforms.length > 0) {
            this.render();
        }
    }

    start() {
        if (this.isGameStarted) return;
        this.isGameStarted = true;
        document.getElementById('startDoodle').style.display = 'none';
        
        // Добавляем начальный импульс при старте
        this.player.velocityY = this.player.jumpForce;
        
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isGameStarted) return;
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        if (!this.ctx) return;

        // Очистка canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-color');
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Отрисовка платформ
        this.ctx.fillStyle = '#4CAF50';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(
                Math.round(platform.x), 
                Math.round(platform.y), 
                platform.width, 
                platform.height
            );
        });

        // Отрисовка игрока
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(
            Math.round(this.player.x), 
            Math.round(this.player.y), 
            this.player.width, 
            this.player.height
        );
    }

    updateScore() {
        document.getElementById('scoreDoodle').textContent = this.score;
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('doodleHighscore', this.highscore);
            document.getElementById('highscoreDoodle').textContent = this.highscore;
        }
    }

    gameOver() {
        this.isGameStarted = false;
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
            document.getElementById('startDoodle').style.display = 'block';
        };
    }
} 