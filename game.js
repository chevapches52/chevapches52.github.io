class BlockBlast {
    constructor() {
        this.grid = Array(8).fill().map(() => Array(8).fill(0));
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem('blockBlastHighscore')) || 0;
        this.colors = ['#FF4D4D', '#4CAF50', '#673AB7', '#FF9800', '#9C27B0'];
        this.pieces = [];
        this.init();
    }

    init() {
        this.score = 0;
        this.updateScore();
        this.updateHighscore();
        this.createGrid();
        this.generatePieces();
        this.setupEventListeners();
        this.setupTouchEvents();
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                gridElement.appendChild(cell);
            }
        }
    }

    generatePieces() {
        const piecesContainer = document.getElementById('pieces');
        piecesContainer.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const piece = this.createRandomPiece();
            piecesContainer.appendChild(piece);
        }

        // Проверяем, можно ли разместить хотя бы один блок
        if (!this.canPlaceAnyPiece()) {
            this.gameOver();
        }
    }

    createRandomPiece() {
        const shapes = [
            [[1, 1], [1, 1]], // квадрат 2x2
            [[1], [1], [1]], // палка 3x1
            [[1, 1, 1]], // палка 1x3
            [[1, 1], [1]], // уголок
            [[1, 1], [0, 1]], // зигзаг
            [[1]], // одиночный блок
            [[1, 1]] // палка 1x2
        ];

        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const piece = document.createElement('div');
        piece.className = 'piece';
        piece.style.gridTemplateRows = `repeat(${shape.length}, 30px)`;
        piece.style.gridTemplateColumns = `repeat(${shape[0].length}, 30px)`;
        
        piece.shape = shape;
        piece.color = color;
        
        shape.forEach(row => {
            row.forEach(cell => {
                const div = document.createElement('div');
                if (cell) {
                    div.className = 'piece-cell';
                    div.style.backgroundColor = color;
                }
                piece.appendChild(div);
            });
        });

        piece.draggable = true;
        this.addDragListeners(piece);
        
        return piece;
    }

    addDragListeners(piece) {
        piece.addEventListener('dragstart', (e) => {
            piece.classList.add('dragging');
            e.dataTransfer.setData('text/plain', '');
        });

        piece.addEventListener('dragend', () => {
            piece.classList.remove('dragging');
        });
    }

    setupEventListeners() {
        const grid = document.getElementById('grid');
        
        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            const cell = this.getCellFromMousePosition(e.clientX, e.clientY);
            if (!cell) return;

            const piece = document.querySelector('.piece.dragging');
            if (!piece) return;

            this.clearPreview();

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            this.showPreview(piece.shape, piece.color, row, col);
        });

        grid.addEventListener('dragleave', () => {
            this.clearPreview();
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            this.clearPreview();
            const piece = document.querySelector('.piece.dragging');
            if (!piece) return;

            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);

            if (this.canPlacePiece(piece.shape, row, col)) {
                this.placePiece(piece.shape, piece.color, row, col);
                piece.remove();
                
                if (document.querySelectorAll('.piece').length === 0) {
                    this.generatePieces();
                }
                
                this.checkLines();
            }
        });

        document.getElementById('restart').addEventListener('click', () => {
            this.init();
        });
    }

    getCellFromMousePosition(x, y) {
        // Временно скрываем перетаскиваемый элемент для точного определения элемента под курсором
        const draggingPiece = document.querySelector('.piece.dragging');
        if (draggingPiece) {
            draggingPiece.style.display = 'none';
        }
        
        const element = document.elementFromPoint(x, y);
        
        if (draggingPiece) {
            draggingPiece.style.display = '';
        }

        return element?.closest('.cell');
    }

    canPlacePiece(shape, startRow, startCol) {
        // Проверяем, помещается ли фигура на поле
        if (startRow + shape.length > 8 || startCol + shape[0].length > 8) {
            return false;
        }

        // Проверяем, не занято ли место другими блоками
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                if (shape[i][j] === 1) {
                    if (this.grid[startRow + i][startCol + j] === 1) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    placePiece(shape, color, startRow, startCol) {
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                if (shape[i][j] === 1) {
                    this.grid[startRow + i][startCol + j] = 1;
                    const cell = document.querySelector(
                        `.cell[data-row="${startRow + i}"][data-col="${startCol + j}"]`
                    );
                    cell.classList.add('filled');
                    cell.style.backgroundColor = color;
                }
            }
        }
        this.updateScore(10);

        // После размещения блока проверяем возможность продолжения игры
        setTimeout(() => {
            if (!this.canPlaceAnyPiece()) {
                this.gameOver();
            }
        }, 300);
    }

    checkLines() {
        let linesCleared = 0;
        
        // Проверяем горизонтальные линии
        for (let i = 0; i < 8; i++) {
            if (this.grid[i].every(cell => cell === 1)) {
                this.clearLine(i, 'horizontal');
                linesCleared++;
            }
        }

        // Проверяем вертикальные линии
        for (let j = 0; j < 8; j++) {
            if (this.grid.every(row => row[j] === 1)) {
                this.clearLine(j, 'vertical');
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            this.updateScore(linesCleared * 100);
        }
    }

    clearLine(index, direction) {
        const cells = [];
        if (direction === 'horizontal') {
            for (let j = 0; j < 8; j++) {
                const cell = document.querySelector(
                    `.cell[data-row="${index}"][data-col="${j}"]`
                );
                cells.push({ cell, row: index, col: j });
            }
        } else {
            for (let i = 0; i < 8; i++) {
                const cell = document.querySelector(
                    `.cell[data-row="${i}"][data-col="${index}"]`
                );
                cells.push({ cell, row: i, col: index });
            }
        }

        // Добавляем анимацию очистки
        cells.forEach(({cell}) => {
            cell.classList.add('cleared');
        });

        // Очищаем после анимации
        setTimeout(() => {
            cells.forEach(({cell, row, col}) => {
                this.grid[row][col] = 0;
                cell.classList.remove('filled', 'cleared');
                cell.style.backgroundColor = '';
            });
        }, 300);
    }

    updateScore(points = 0) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        // Обновляем рекорд, если текущий счет больше
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('blockBlastHighscore', this.highscore);
            this.updateHighscore();
        }
    }

    updateHighscore() {
        document.getElementById('highscore').textContent = this.highscore;
    }

    showPreview(shape, color, startRow, startCol) {
        // Сначала проверяем, можно ли разместить фигуру
        const canPlace = this.canPlacePiece(shape, startRow, startCol);
        
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                if (shape[i][j] === 1) {
                    const cell = document.querySelector(
                        `.cell[data-row="${startRow + i}"][data-col="${startCol + j}"]`
                    );
                    if (cell) {
                        cell.classList.add('preview');
                        cell.style.color = color;
                        if (canPlace) {
                            cell.classList.add('valid-target');
                        } else {
                            cell.classList.add('invalid-target');
                        }
                    }
                }
            }
        }
    }

    clearPreview() {
        document.querySelectorAll('.cell.preview').forEach(cell => {
            cell.classList.remove('preview', 'valid-target', 'invalid-target');
            cell.style.color = '';
        });
    }

    setupTouchEvents() {
        let activePiece = null;
        let startX, startY;
        let initialX, initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => {
            piece.addEventListener('touchstart', this.dragStart.bind(this));
            piece.addEventListener('touchmove', this.drag.bind(this));
            piece.addEventListener('touchend', this.dragEnd.bind(this));
        });

        this.activePiece = null;
        this.isDragging = false;
    }

    dragStart(e) {
        if (e.target.closest('.piece')) {
            e.preventDefault();
            this.activePiece = e.target.closest('.piece');
            const touch = e.touches[0];
            
            initialX = touch.clientX - xOffset;
            initialY = touch.clientY - yOffset;
            
            const rect = this.activePiece.getBoundingClientRect();
            startX = touch.clientX - rect.left;
            startY = touch.clientY - rect.top;

            this.activePiece.classList.add('dragging');
            this.isDragging = true;
            
            this.activePiece.style.position = 'fixed';
            this.activePiece.style.left = rect.left + 'px';
            this.activePiece.style.top = rect.top + 'px';
        }
    }

    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            
            const touch = e.touches[0];
            const x = touch.clientX - startX;
            const y = touch.clientY - startY;
            
            this.activePiece.style.left = `${x}px`;
            this.activePiece.style.top = `${y}px`;
            
            this.handleDragPreview(touch.clientX, touch.clientY);
        }
    }

    handleDragPreview(x, y) {
        this.clearPreview();
        
        const cell = this.getCellFromMousePosition(x, y);
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.showPreview(this.activePiece.shape, this.activePiece.color, row, col);
        }
    }

    dragEnd(e) {
        if (!this.isDragging) return;
        
        const touch = e.changedTouches[0];
        const cell = this.getCellFromMousePosition(touch.clientX, touch.clientY);
        
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.canPlacePiece(this.activePiece.shape, row, col)) {
                this.placePiece(this.activePiece.shape, this.activePiece.color, row, col);
                this.activePiece.remove();
                if (document.querySelectorAll('.piece').length === 0) {
                    this.generatePieces();
                }
                this.checkLines();
            } else {
                this.returnPieceToOrigin();
            }
        } else {
            this.returnPieceToOrigin();
        }
        
        this.clearPreview();
        this.isDragging = false;
        this.activePiece = null;
    }

    returnPieceToOrigin() {
        if (!this.activePiece) return;
        
        this.activePiece.style.transition = 'all 0.2s ease';
        this.activePiece.style.position = '';
        this.activePiece.style.left = '';
        this.activePiece.style.top = '';
        this.activePiece.style.transform = '';
        
        setTimeout(() => {
            this.activePiece.style.transition = '';
            this.activePiece.classList.remove('dragging');
        }, 200);
    }

    canPlaceAnyPiece() {
        const pieces = document.querySelectorAll('.piece');
        
        // Проверяем каждую позицию на поле для каждой фигуры
        for (let piece of pieces) {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.canPlacePiece(piece.shape, row, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    showMessage(message, duration = 2000) {
        const messageEl = document.getElementById('gameMessage');
        messageEl.textContent = message;
        messageEl.classList.add('show');
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, duration);
    }

    gameOver() {
        const message = `Игра окончена! Ваш счет: ${this.score}`;
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('highscore', this.highscore);
            document.getElementById('highscore').textContent = this.highscore;
            this.showMessage(message + '\nНовый рекорд!');
        } else {
            this.showMessage(message);
        }
        this.init();
    }
}

window.onload = () => {
    new BlockBlast();
}; 