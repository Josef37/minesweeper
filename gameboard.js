class Gameboard {
	constructor(width, height) {
		this.board = [];
		for(let x=0; x<width; x++) {
			for(let y=0; y<height; y++) {
				board[x][y] = new Cell(Math.random() < 0.25);
			}
		}
	}

}
