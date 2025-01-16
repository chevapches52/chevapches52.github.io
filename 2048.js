class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('highscore2048')) || 0;
        document.getElementById('highscore2048').textContent = this.highscore;
        this.init();
    }

    init() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        document.getElementById('score2048').textContent = this.score;
        this.addNewTile();
        this.addNewTile();
        this.render();
        this.setupEventListeners();
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({i, j});
                }
            }
        }
        if (emptyCells.length) {
            const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    render() {
        const container = document.querySelector('.grid-2048');
        container.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell-2048';
                if (this.grid[i][j] !== 0) {
                    cell.textContent = this.grid[i][j];
                    cell.classList.add(`tile-${this.grid[i][j]}`);
                }
                container.appendChild(cell);
            }
        }
    }

    move(direction) {
        const oldGrid = JSON.stringify(this.grid);
        
        switch(direction) {
            case 'left': this.moveLeft(); break;
            case 'right': this.moveRight(); break;
            case 'up': this.moveUp(); break;
            case 'down': this.moveDown(); break;
        }

        if (oldGrid !== JSON.stringify(this.grid)) {
            this.addNewTile();
            this.render();
            this.isGameOver();
        }
    }

    moveLeft() {
        for (let i = 0; i < 4; i++) {
            let row = this.grid[i].filter(x => x !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.updateScore(row[j]);
                    row.splice(j + 1, 1);
                }
            }
            while (row.length < 4) row.push(0);
            this.grid[i] = row;
        }
    }

    moveRight() {
        for (let i = 0; i < 4; i++) {
            let row = this.grid[i].filter(x => x !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.updateScore(row[j]);
                    row.splice(j - 1, 1);
                    j--;
                }
            }
            while (row.length < 4) row.unshift(0);
            this.grid[i] = row;
        }
    }

    moveUp() {
        for (let j = 0; j < 4; j++) {
            let column = [];
            for (let i = 0; i < 4; i++) {
                if (this.grid[i][j] !== 0) column.push(this.grid[i][j]);
            }
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.updateScore(column[i]);
                    column.splice(i + 1, 1);
                }
            }
            while (column.length < 4) column.push(0);
            for (let i = 0; i < 4; i++) {
                this.grid[i][j] = column[i];
            }
        }
    }

    moveDown() {
        for (let j = 0; j < 4; j++) {
            let column = [];
            for (let i = 0; i < 4; i++) {
                if (this.grid[i][j] !== 0) column.push(this.grid[i][j]);
            }
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.updateScore(column[i]);
                    column.splice(i - 1, 1);
                    i--;
                }
            }
            while (column.length < 4) column.unshift(0);
            for (let i = 0; i < 4; i++) {
                this.grid[i][j] = column[i];
            }
        }
    }

    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }
        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.grid[i][j] === this.grid[i][j + 1]) return false;
            }
        }
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 3; i++) {
                if (this.grid[i][j] === this.grid[i + 1][j]) return false;
            }
        }
        
        // Если игра окончена, показываем модальное окно
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
        
        return true;
    }

    updateScore(mergeValue) {
        this.score += mergeValue;
        document.getElementById('score2048').textContent = this.score;
        
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('highscore2048', this.highscore);
            document.getElementById('highscore2048').textContent = this.highscore;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('game2048').classList.contains('active')) return;
            
            switch(e.key) {
                case 'ArrowLeft': 
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
            }
        });

        document.getElementById('restart2048').addEventListener('click', () => {
            this.init();
        });

        // Touch events
        let touchStartX, touchStartY;
        const gameContainer = document.querySelector('.grid-2048');

        gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        gameContainer.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            if (Math.max(absDx, absDy) > 10) {
                if (absDx > absDy) {
                    this.move(dx > 0 ? 'right' : 'left');
                } else {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            }
        });
    }
} 