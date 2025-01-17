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
            if (!this.isGameStarted) return;
            if (e.key === 'ArrowLeft') this.player.velocityX = -this.player.speed;
            if (e.key === 'ArrowRight') this.player.velocityX = this.player.speed;
        };

        const handleKeyUp = (e) => {
            if (e.key === 'ArrowLeft' && this.player.velocityX < 0) this.player.velocityX = 0;
            if (e.key === 'ArrowRight' && this.player.velocityX > 0) this.player.velocityX = 0;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Мобильное управление
        window.addEventListener('deviceorientation', (e) => {
            if (!this.isGameStarted) return;
            const tilt = e.gamma;
            if (tilt !== null) {
                this.player.velocityX = (tilt / 45) * this.player.speed;
            }
        });

        // Обработчик кнопки старта
        document.getElementById('startDoodle').addEventListener('click', () => this.start());
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            if (!this.isGameStarted) this.render();
        });

        // Сенсорное управление
        let touchStartX = null;
        const touchThreshold = 30; // Минимальное расстояние для срабатывания свайпа

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Предотвращаем скролл страницы
            if (!this.isGameStarted || touchStartX === null) return;

            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            
            // Плавное движение
            this.player.velocityX = (diff / 50) * this.player.speed;
        });

        this.canvas.addEventListener('touchend', () => {
            this.player.velocityX = 0;
            touchStartX = null;
        });

        // Запуск игры по тапу
        this.canvas.addEventListener('touchstart', () => {
            if (!this.isGameStarted) {
                this.start();
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