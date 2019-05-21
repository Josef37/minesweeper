// representation of a single cell in the minesweeper grid
class Cell {
    constructor(hasMine) {
        this.hasMine = hasMine;
        this.isRevealed = false;
        this.isFlagged = false;
        this.isHighlighted = false;
    }
    setMineCount(mineCount) {
        this.adjacentMinesCount = mineCount;
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
    toggleFlag() {
        if (this.isRevealed) {
            return false;
        }
        this.isFlagged = !this.isFlagged;
        return true;
    }
    // draw square with border and mine, count or flag
    draw(context, x, y, size, gameover = false) {
        // draw square with border
        if (this.isRevealed) {
            context.fillStyle = "#fff";
        }
        else if (this.isHighlighted) {
            context.fillStyle = "#ddf";
        }
        else {
            context.fillStyle = "#bbf";
        }
        context.fillRect(x, y, size, size);
        context.strokeStyle = "black";
        context.lineWidth = size / 20;
        context.strokeRect(x, y, size, size);
        // draw mine or count for revealed cell
        if (this.isRevealed || gameover) {
            if (this.hasMine) {
                context.fillStyle = "black";
                context.beginPath();
                context.arc(x + size / 2, y + size / 2, size / 5, 0, 2 * Math.PI);
                context.fill();
            }
            else if (this.adjacentMinesCount > 0) {
                context.fillStyle = "black";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.font = `${size * 0.6}px sans-serif`;
                context.fillText(this.adjacentMinesCount.toString(), x + size * 0.5, y + size * 0.55, size);
            }
        }
        // draw flag for flagged cell
        if (!this.isRevealed && this.isFlagged) {
            context.fillStyle = "red";
            context.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
        }
    }
}