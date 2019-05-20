class Cell {
  hasMine: boolean;
  isRevealed: boolean;
  isMarked: boolean;
  mineCount: number;
  highlighted: boolean;

	constructor(hasMine: boolean) {
		this.hasMine = hasMine;
		this.isRevealed = false;
		this.isMarked = false;
		this.mineCount = -1;
		this.highlighted = false;
	}

	setMineCount(mineCount: number) {
		this.mineCount = mineCount;
	}

	// return true, if something changes
	reveal() {
		if (this.isRevealed) {
			return false;
		}
		this.isRevealed = true;
		return true;
	}

	// return true, if something changes
	toggleMark() {
		if (this.isRevealed) {
			return false;
		}
		this.isMarked = !this.isMarked;
		return true;
	}

	draw(context: CanvasRenderingContext2D, x: number, y: number, size: number, gameover = false) {
		if (this.isRevealed) {
			context.fillStyle = "#fff";
		} else if (this.highlighted) {
			context.fillStyle = "#ddf";
		} else {
			context.fillStyle = "#bbf"
		}
		context.fillRect(x, y, size, size);
		context.strokeStyle = "black";
		context.lineWidth = size / 20;
		context.strokeRect(x, y, size, size);

		if (this.isRevealed || gameover) {
			if (this.hasMine) {
				context.fillStyle = "black";
				context.beginPath();
				context.arc(x + size / 2, y + size / 2, size / 5, 0, 2 * Math.PI);
				context.fill();
			}
			if (this.mineCount > 0) {
				context.fillStyle = "black";
				context.textAlign = "center";
				context.textBaseline = "middle";
				context.font = `${size * 0.6}px sans-serif`;
				context.fillText(this.mineCount.toString(), x + size * 0.5, y + size * 0.55, size);
			}
		}
		if (!this.isRevealed && this.isMarked) {
			context.fillStyle = "red";
			context.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
		}
	}
}
