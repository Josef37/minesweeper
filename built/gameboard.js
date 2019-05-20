class Gameboard {
    constructor(width, height, mineCount) {
        this.board = [];
        this.width = width;
        this.height = height;
        this.mineCount = mineCount;
        this.unrevealedCells = width * height;
        this.cellSize;
        this.gameover = false;
        this.won = false;
        this.drawProbabilityMap = false;
        this.mineProbabilityMap;
        this.highlightedX = -1;
        this.highlightedY = -1;
        this.firstActionSave = true;
        this.chanceOfSurvial = 1;
        this.createCells();
    }
    createCells() {
        let hasMine = Array(this.mineCount).fill(true).concat(Array(this.width * this.height - this.mineCount).fill(false));
        Utils.shuffle(hasMine);
        this.createCellsFromArray(hasMine);
    }
    // makes sure no mine is at position (x,y)
    createCellsSave(x, y) {
        let hasMine = Array(this.mineCount).fill(true).concat(Array(this.width * this.height - this.mineCount - 1).fill(false));
        Utils.shuffle(hasMine);
        hasMine.splice(Utils.getIndex(x, y, this.width), 0, false);
        this.createCellsFromArray(hasMine);
    }
    createCellsFromArray(hasMine) {
        for (let x = 0; x < this.width; x++) {
            this.board[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.board[x][y] = new Cell(hasMine[Utils.getIndex(x, y, this.width)]);
            }
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.board[x][y].setMineCount(this.countMines(x, y));
            }
        }
    }
    reset() {
        this.gameover = false;
        this.won = false;
        this.chanceOfSurvial = 1;
        this.unrevealedCells = this.width * this.height;
        this.createCells();
        console.clear();
    }
    iterateNeighbours(x, y, callback) {
        for (let dx of [-1, 0, 1]) {
            for (let dy of [-1, 0, 1]) {
                // ignore the mine itself
                if (dx == 0 && dy == 0) {
                    continue;
                }
                let neighbourX = x + dx, neighbourY = y + dy;
                if (!this.validCoordinates(neighbourX, neighbourY)) {
                    continue;
                }
                callback(this.board[neighbourX][neighbourY], neighbourX, neighbourY);
            }
        }
    }
    countMines(x, y) {
        if (this.board[x][y].hasMine) {
            return -1;
        }
        let count = 0;
        this.iterateNeighbours(x, y, cell => count += Number(cell.hasMine));
        return count;
    }
    doAction(x, y) {
        this.drawProbabilityMap = false;
        if (this.gameover || !this.validCoordinates(x, y) || this.board[x][y].isFlagged) {
            return false;
        }
        if (this.isInitialState() && this.firstActionSave) {
            this.createCellsSave(x, y);
        }
        let cell = this.board[x][y];
        let revealedCells = [];
        let mineRevealed = false;
        if (cell.isRevealed) {
            mineRevealed = this.autoRevealCells(x, y, revealedCells);
        }
        else {
            mineRevealed = this.revealCell(x, y, revealedCells);
        }
        this.unrevealedCells -= revealedCells.length;
        if (mineRevealed) {
            this.gameover = true;
            this.won = false;
        }
        else if (this.unrevealedCells == this.mineCount) {
            this.gameover = true;
            this.won = true;
        }
        return revealedCells.length > 0;
    }
    // returns true, if mine was revealed
    autoRevealCells(x, y, revealedCells) {
        let cell = this.board[x][y];
        let flaggedCount = 0;
        this.iterateNeighbours(x, y, neighbour => flaggedCount += Number(neighbour.isFlagged));
        if (flaggedCount != cell.adjacentMinesCount) {
            return false;
        }
        let mineRevealed = false;
        this.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
            if (!neighbour.isFlagged) {
                mineRevealed = mineRevealed || this.revealCell(neighbourX, neighbourY, revealedCells);
            }
        });
        return mineRevealed;
    }
    // returns true, if mine was revealed
    revealCell(x, y, revealedCells) {
        let cell = this.board[x][y];
        if (revealedCells.includes(cell)) {
            return false;
        }
        if (!cell.reveal()) {
            return false;
        }
        revealedCells.push(cell);
        if (cell.hasMine) {
            return true;
        }
        let mineOpened = false;
        if (cell.adjacentMinesCount == 0) {
            this.iterateNeighbours(x, y, (_neighbour, neighbourX, neighbourY) => mineOpened = mineOpened || this.revealCell(neighbourX, neighbourY, revealedCells));
        }
        return mineOpened;
    }
    flagCell(x, y) {
        if (this.gameover || !this.validCoordinates(x, y)) {
            return false;
        }
        let cell = this.board[x][y];
        return cell.toggleFlag();
    }
    countRemainingMines() {
        let flaggedCellsCount = 0;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let cell = this.board[x][y];
                if (cell.isFlagged && !cell.isRevealed) {
                    flaggedCellsCount++;
                }
            }
        }
        return this.mineCount - flaggedCellsCount;
    }
    isInitialState() {
        return this.unrevealedCells == this.width * this.height;
    }
    getCoordinates(canvasX, canvasY) {
        return [Math.floor(canvasX / this.cellSize), Math.floor(canvasY / this.cellSize)];
    }
    validCoordinates(x, y) {
        return 0 <= x && x < this.width && 0 <= y && y < this.height;
    }
    highlight(context, x, y) {
        if (this.drawProbabilityMap) {
            return;
        }
        x = Math.floor(x / this.cellSize);
        y = Math.floor(y / this.cellSize);
        if (this.gameover) {
            return;
        }
        if (x == this.highlightedX && y == this.highlightedY) {
            return;
        }
        if (this.validCoordinates(this.highlightedX, this.highlightedY)) {
            this.board[this.highlightedX][this.highlightedY].isHighlighted = false;
            this.board[this.highlightedX][this.highlightedY]
                .draw(context, this.highlightedX * this.cellSize, this.highlightedY * this.cellSize, this.cellSize);
        }
        if (!this.validCoordinates(x, y)) {
            this.highlightedX = this.highlightedY = -1;
            return;
        }
        this.highlightedX = x;
        this.highlightedY = y;
        this.board[x][y].isHighlighted = true;
        this.board[x][y].draw(context, x * this.cellSize, y * this.cellSize, this.cellSize);
    }
    draw(context, width, height) {
        if (this.drawProbabilityMap && this.validCoordinates(this.highlightedX, this.highlightedY)) { // unset highlight
            this.board[this.highlightedX][this.highlightedY].isHighlighted = false;
            this.highlightedX = this.highlightedY = -1;
        }
        this.cellSize = Math.floor(Math.min(width / this.width, (height / 1.1) / this.height)); // extra space for count
        context.clearRect(0, 0, width, height);
        width = this.width * this.cellSize;
        height = this.height * this.cellSize;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.board[x][y].draw(context, x * this.cellSize, y * this.cellSize, this.cellSize, this.gameover);
            }
        }
        context.fillStyle = "black";
        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = `${height * 0.06}px sans-serif`;
        context.fillText("Mines remaining: " + this.countRemainingMines(), width, height + height * 0.03);
        if (this.gameover) {
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.fillRect(0, 0, width, height);
            let centerX = width / 2;
            let centerY = height / 2;
            context.fillStyle = "black";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = `${height * 0.06}px sans-serif`;
            context.fillText(this.won ? 'You\'ve won!' : 'You\'ve lost...', centerX, centerY - 0.05 * height);
            context.font = `${height * 0.03}px sans-serif`;
            context.fillText('(right-click to restart)', centerX, centerY + 0.025 * height);
        }
        if (this.drawProbabilityMap) {
            for (let [cell, mineProbability] of this.mineProbabilityMap.entries()) {
                let [x, y] = Utils.getCoordinates(cell, this.width);
                context.fillStyle = `rgba(0,0,0,${mineProbability / 2})`;
                context.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                context.fillStyle = "black";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.font = `${this.cellSize * 0.4}px sans-serif`;
                context.fillText(mineProbability.toFixed(2), (x + 0.5) * this.cellSize, (y + 0.5) * this.cellSize);
            }
        }
    }
}
