// representation of a single cell in the minesweeper grid
class Cell {
  isRevealed: boolean = false;
  isFlagged: boolean = false;
  numberOfAdjacentMines: number = -1;
  isHighlighted: boolean = false;

	constructor(public hasMine: boolean) {}

	setNumberOfAdjacentMines(numberOfAdjacentMines: number) {
		this.numberOfAdjacentMines = numberOfAdjacentMines;
	}

	reveal() {
		this.isRevealed = true;
	}

	toggleFlag() {
		this.isFlagged = !this.isFlagged;
	}

  // draw square with border and mine, count or flag
	draw(context: CanvasRenderingContext2D, x: number, y: number, size: number, isGameover = false) {
    // draw square with border
		if (this.isRevealed) {
			context.fillStyle = "#fff";
		} else if (this.isHighlighted) {
			context.fillStyle = "#ddf";
		} else {
			context.fillStyle = "#bbf"
		}
		context.fillRect(x, y, size, size);
		context.strokeStyle = "black";
		context.lineWidth = size / 30;
		context.strokeRect(x + context.lineWidth / 2, y + context.lineWidth / 2, size - context.lineWidth, size - context.lineWidth);

    // draw mine or count for revealed cell
		if (this.isRevealed || isGameover) {
			if (this.hasMine) {
				context.fillStyle = "black";
				context.beginPath();
				context.arc(x + size / 2, y + size / 2, size / 5, 0, 2 * Math.PI);
				context.fill();
			} else if (this.numberOfAdjacentMines > 0) {
				context.fillStyle = "black";
				context.textAlign = "center";
				context.textBaseline = "middle";
				context.font = `${size * 0.6}px sans-serif`;
				context.fillText(this.numberOfAdjacentMines.toString(), x + size * 0.5, y + size * 0.55, size);
			}
		}
    // draw flag for flagged cell
		if (!this.isRevealed && this.isFlagged) {
			context.fillStyle = "red";
			context.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
		}
	}
}
