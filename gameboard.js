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
		this.createCells();
	}

	createCells() {
		let hasMine = Array(this.mineCount).fill(true).concat(
									Array(this.width*this.height - this.mineCount).fill(false));
		Utils.shuffle(hasMine);
		for(let x=0; x<this.width; x++) {
			this.board[x] = [];
			for(let y=0; y<this.height; y++) {
				this.board[x][y] = new Cell(hasMine[x*this.width + y]);
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

	validCoordinates(x, y) {
		return 0 <= x && x < this.width && 0 <= y && y < this.height;
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
		x = Math.floor(x/this.cellSize);
		y = Math.floor(y/this.cellSize);
		if(this.gameover || !this.validCoordinates(x, y) || this.board[x][y].isMarked) {
			return false;
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
		x = Math.floor(x/this.cellSize);
		y = Math.floor(y/this.cellSize);
		if(this.gameover || !this.validCoordinates(x, y)) {
			return false;
		}

		let cell = this.board[x][y];
		return cell.toggleMark();
	}

	draw(context, width, height) {
		this.cellSize = Math.floor(Math.min(width/this.width,
		 																		height/this.height));
		context.clearRect(0, 0, width, height);
		for(let x=0; x<this.width; x++) {
			for(let y=0; y<this.height; y++) {
				this.board[x][y].draw(context, x*this.cellSize, y*this.cellSize, this.cellSize, this.gameover);
			}
		}

		if(this.gameover) {
			context.fillStyle = 'rgba(255, 255, 255, 0.8)';
			context.fillRect(0, 0, this.cellSize*this.width, this.cellSize*this.height);

			let centerX = this.cellSize * this.width / 2;
			let centerY = this.cellSize * this.height / 2;

			context.fillStyle = "black";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.font = `${this.cellSize*0.6}px sans-serif`;
			context.fillText(this.won ? 'You\'ve won!' : 'You\'ve lost...',
			 									centerX, centerY - 0.5*this.cellSize);
			context.font = `${this.cellSize*0.3}px sans-serif`;
			context.fillText('(right-click to restart)', centerX, centerY + 0.5*this.cellSize);
		}
	}
}
