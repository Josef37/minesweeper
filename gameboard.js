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
		this.highlightedX = -1;
		this.highlightedY = -1;
		this.createCells();
	}

	createCells() {
		let hasMine = Array(this.mineCount).fill(true).concat(
									Array(this.width*this.height - this.mineCount).fill(false));
		Utils.shuffle(hasMine);
		this.createCellsFromArray(hasMine);
	}

	// makes sure no mine is at position (x,y)
	createCellsSave(x, y) {
		let hasMine = Array(this.mineCount).fill(true).concat(
									Array(this.width*this.height - this.mineCount - 1).fill(false));
		Utils.shuffle(hasMine);
		hasMine.splice(x*this.height + y, 0, false);
		this.createCellsFromArray(hasMine);
	}

	createCellsFromArray(hasMine) {
		for(let x=0; x<this.width; x++) {
			this.board[x] = [];
			for(let y=0; y<this.height; y++) {
				this.board[x][y] = new Cell(hasMine[x*this.height + y]);
			}
		}

		for(let x=0; x<this.width; x++) {
			for(let y=0; y<this.height; y++) {
				this.board[x][y].setMineCount(this.countMines(x, y));
			}
		}
	}

	reset() {
		this.gameover = false;
		this.won = false;
		this.unrevealedCells = this.width * this.height;
		this.createCells();
	}

	iterateNeighbours(x, y, callback) {
		for(let dx of [-1, 0, 1]) {
			for(let dy of [-1, 0, 1]) {
				// ignore the mine itself
				if(dx == 0 && dy == 0) {
					continue;
				}
				let neighbourX = x+dx,
						neighbourY = y+dy;
				if(!this.validCoordinates(neighbourX, neighbourY)) {
					continue;
				}
				callback(this.board[neighbourX][neighbourY], neighbourX, neighbourY);
			}
		}
	}

	countMines(x, y) {
		if(this.board[x][y].hasMine) {
			return -1;
		}
		let count = 0;
		this.iterateNeighbours(x, y, cell => count += cell.hasMine);
		return count;
	}

	doAction(x, y) {
		if(this.gameover || !this.validCoordinates(x, y) || this.board[x][y].isMarked) {
			return false;
		}
		if(this.unrevealedCells == this.width*this.height) {
			this.createCellsSave(x, y);
		}
		let cell = this.board[x][y];
		let revealedCells = [];
		let mineRevealed = false;
		if(cell.isRevealed) {
			mineRevealed = this.autoRevealCells(x, y, revealedCells);
		} else {
			mineRevealed = this.revealCell(x, y, revealedCells);
		}
		this.unrevealedCells -= revealedCells.length;
		if(mineRevealed) {
			this.gameover = true;
			this.won = false;
		} else if (this.unrevealedCells == this.mineCount) {
			this.gameover = true;
			this.won = true;
		}
		return revealedCells.length > 0;
	}

	// returns true, if mine was revealed
	autoRevealCells(x, y, revealedCells) {
		let cell = this.board[x][y];
		let markedCount = 0;
		this.iterateNeighbours(x, y, neighbour => markedCount += neighbour.isMarked);
		if(markedCount != cell.mineCount) {
			return false;
		}
		let mineRevealed = false;
		this.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
			if(!neighbour.isMarked) {
				mineRevealed = mineRevealed || this.revealCell(neighbourX, neighbourY, revealedCells);
			}
		});
		return mineRevealed;
	}

	// returns true, if mine was revealed
	revealCell(x, y, revealedCells) {
		let cell = this.board[x][y];
		if(revealedCells.includes(cell)) {
			return false;
		}
		if(!cell.reveal()) {
			return false;
		}
		revealedCells.push(cell);
		if(cell.hasMine) {
			return true;
		}
		let mineOpened = false;
		if(cell.mineCount == 0) {
			this.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) =>
															mineOpened = mineOpened || this.revealCell(neighbourX, neighbourY, revealedCells));
		}
		return mineOpened;
	}

	markCell(x, y) {
		if(this.gameover || !this.validCoordinates(x, y)) {
			return false;
		}

		let cell = this.board[x][y];
		return cell.toggleMark();
	}

	countRemainingMines() {
		let markedCellsCount = 0;
		for(let x=0; x<this.width; x++) {
			for(let y=0; y<this.height; y++) {
				let cell = this.board[x][y];
				if(cell.isMarked && !cell.isRevealed) {
					markedCellsCount++;
				}
			}
		}
		return this.mineCount - markedCellsCount;
	}

	getCoordinates(canvasX, canvasY) {
		return [Math.floor(canvasX/this.cellSize), Math.floor(canvasY/this.cellSize)];
	}

	validCoordinates(x, y) {
		return 0 <= x && x < this.width && 0 <= y && y < this.height;
	}

	convertForTenserflow() {
		let tensor = [];
		for(let x=0; x<this.width; x++) {
			tensor[x] = []
			for(let y=0; y<this.height; y++) {
				let cell = this.board[x][y];
				if(!cell.isRevealed) {
					tensor[x][y] = -1;
				} else {
					tensor[x][y] = cell.mineCount;
				}
			}
		}
		return tensor;
	}

	highlight(context, x, y) {
		x = Math.floor(x/this.cellSize);
		y = Math.floor(y/this.cellSize);
		if(this.gameover) {
			return;
		}
		if(x == this.highlightedX && y == this.highlightedY) {
			return;
		}
		if(this.validCoordinates(this.highlightedX, this.highlightedY)) {
			this.board[this.highlightedX][this.highlightedY].highlighted = false;
			this.board[this.highlightedX][this.highlightedY]
				.draw(context, this.highlightedX*this.cellSize, this.highlightedY*this.cellSize, this.cellSize);
		}
		if(!this.validCoordinates(x, y)) {
			this.highlightedX = this.highlightedY = -1;
			return;
		}
		this.highlightedX = x;
		this.highlightedY = y;
		this.board[x][y].highlighted = true;
		this.board[x][y].draw(context, x*this.cellSize, y*this.cellSize, this.cellSize);
	}

	draw(context, width, height) {
		this.cellSize = Math.floor(Math.min(width/this.width,	(height/1.1)/this.height)); // extra space for count
		context.clearRect(0, 0, width, height);
		width = this.width * this.cellSize;
		height = this.height * this.cellSize;
		for(let x=0; x<this.width; x++) {
			for(let y=0; y<this.height; y++) {
				this.board[x][y].draw(context, x*this.cellSize, y*this.cellSize, this.cellSize, this.gameover);
			}
		}

		context.fillStyle = "black";
		context.textAlign = "right";
		context.textBaseline = "top";
		context.font = `${height*0.06}px sans-serif`;
		context.fillText("Mines remaining: " + this.countRemainingMines(), width, height+height*0.03);

		if(this.gameover) {
			context.fillStyle = 'rgba(255, 255, 255, 0.8)';
			context.fillRect(0, 0, width, height);

			let centerX = width / 2;
			let centerY = height / 2;

			context.fillStyle = "black";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.font = `${height*0.06}px sans-serif`;
			context.fillText(this.won ? 'You\'ve won!' : 'You\'ve lost...',
			 									centerX, centerY - 0.05*height);
			context.font = `${height*0.03}px sans-serif`;
			context.fillText('(right-click to restart)', centerX, centerY + 0.025*height);
		}
	}
}
