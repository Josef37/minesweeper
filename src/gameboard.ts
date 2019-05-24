import { Utils } from "./utils";
import { Cell } from "./cell";

export enum GameStatus {
  Playing,
  Won = "You've won!",
  Lost = "You've lost..."
}


export class Gameboard {
  board: Cell[][];
  gameStatus: GameStatus;
  cellSizeInCanvas: number;
  drawProbabilityMap: boolean = false;
  mineProbabilityMap: Map<number, number>;
  highlightedX: number;
  highlightedY: number;
  chanceOfSurvial: number;

  constructor(public width: number,
    public height: number,
    public totalNumberOfMines: number,
    public isSaveFirstAction: boolean = true,
    public seed?: number) {
    this.reset();
  }

  // set initial values
  reset() {
    this.gameStatus = GameStatus.Playing;
    this.highlightedX = -1;
    this.highlightedY = -1;
    this.chanceOfSurvial = 1;
    this.createBoard();
  }

  // create cells with "totalNumberOfMines"
  createBoard() {
    let hasMine = Array(this.totalNumberOfMines).fill(true).concat(
      Array(this.width * this.height - this.totalNumberOfMines).fill(false));
    Utils.shuffle(hasMine, this.seed);
    this.createBoardFromArray(hasMine);
  }

  // create cells with "totalNumberOfMines"
  // makes sure no mine is at position (x,y)
  createBoardSave(x: number, y: number) {
    let hasMine = Array(this.totalNumberOfMines).fill(true).concat(
      Array(this.width * this.height - this.totalNumberOfMines - 1).fill(false));
    Utils.shuffle(hasMine, this.seed);
    hasMine.splice(Utils.getIndex(x, y, this.width), 0, false);
    this.createBoardFromArray(hasMine);
  }

  // first: create cells from array indicating if a mine in there
  // second: calculate number of adjacent mines for each cell
  createBoardFromArray(hasMine: boolean[]) {
    this.board = [];
    for (let x = 0; x < this.width; x++) {
      this.board[x] = [];
      for (let y = 0; y < this.height; y++) {
        this.board[x][y] = new Cell(hasMine[Utils.getIndex(x, y, this.width)]);
      }
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.board[x][y].hasMine) {
          continue;
        }
        let numberOfAdjacentMines = 0;
        this.doForAllNeighbours(x, y, cell => numberOfAdjacentMines += Number(cell.hasMine));
        this.board[x][y].setNumberOfAdjacentMines(numberOfAdjacentMines);
      }
    }
  }

  // perform callback for all adjacent cells
  doForAllNeighbours(x: number, y: number, callback: (neighbour: Cell, neighbourX?: number, neighbourY?: number) => void) {
    for (let dx of [-1, 0, 1]) {
      for (let dy of [-1, 0, 1]) {
        if (dx == 0 && dy == 0) {   // ignore the cell itself
          continue;
        }
        let neighbourX = x + dx,
          neighbourY = y + dy;
        if (!this.areValidCoordinates(neighbourX, neighbourY)) {
          continue;
        }
        callback(this.board[neighbourX][neighbourY], neighbourX, neighbourY);
      }
    }
  }

  // action for a click on cell at (x, y)
  // return, if an action was performed
  doAction(x: number, y: number): boolean {
    if (this.gameStatus != GameStatus.Playing || !this.areValidCoordinates(x, y) || this.board[x][y].isFlagged) {
      return false;
    }
    this.drawProbabilityMap = false;
    if (this.isInitialState() && this.isSaveFirstAction) {
      this.createBoardSave(x, y);
    }

    let cell = this.board[x][y];
    let newRevealedCells: Set<Cell> = new Set();
    let mineRevealed: boolean;
    if (cell.isRevealed) {
      mineRevealed = this.autoRevealCells(x, y, newRevealedCells);
    } else {
      mineRevealed = this.revealCell(x, y, newRevealedCells);
    }

    if (mineRevealed) {
      this.gameStatus = GameStatus.Lost;
    } else if (this.getNumberOfUnrevealedCells() == this.totalNumberOfMines) {
      this.gameStatus = GameStatus.Won;
    }
    return newRevealedCells.size > 0;
  }

  // initiate mine revealing for all neighbours, when flagged cells match number of mines; save revealed cells
  // returns true, if mine was revealed
  autoRevealCells(x: number, y: number, revealedCells: Set<Cell>): boolean {
    let cell = this.board[x][y];
    let numberOfFlaggedCells = 0;
    this.doForAllNeighbours(x, y, neighbour => numberOfFlaggedCells += Number(neighbour.isFlagged));
    if (numberOfFlaggedCells != cell.numberOfAdjacentMines) {
      return false;
    }
    let mineRevealed = false;
    this.doForAllNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
      if (!neighbour.isFlagged) {
        mineRevealed = mineRevealed || this.revealCell(neighbourX, neighbourY, revealedCells);
      }
    });
    return mineRevealed;
  }

  // reveal cells and propagate revealing, if there are no mines adjacent; save all revealed cells
  // returns true, if mine was revealed
  revealCell(x: number, y: number, revealedCells: Set<Cell> = new Set()): boolean {
    let toVisit: [number, number][] = [[x, y]];

    while (toVisit.length > 0) {
      let [x, y] = toVisit.shift();
      let cell = this.board[x][y];
      if (cell.isRevealed || revealedCells.has(cell)) {
        continue;
      }
      cell.reveal();
      revealedCells.add(cell);
      if (cell.hasMine) {
        return true;
      }
      if (cell.numberOfAdjacentMines == 0) {
        this.doForAllNeighbours(x, y, (_neighbour, neighbourX, neighbourY) => toVisit.push([neighbourX, neighbourY]));
      }
    }
    return false;
  }

  flagCell(x: number, y: number) {
    if (this.gameStatus != GameStatus.Playing || !this.areValidCoordinates(x, y)) {
      return;
    }
    this.drawProbabilityMap = false;
    this.board[x][y].toggleFlag();
  }

  // count the number of remaining mines considering flagged cells
  countRemainingMines() {
    let numberOfFlaggedCells = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        let cell = this.board[x][y];
        if (cell.isFlagged && !cell.isRevealed) {
          numberOfFlaggedCells++;
        }
      }
    }
    return this.totalNumberOfMines - numberOfFlaggedCells;
  }

  // return if no cell is revealed
  isInitialState() {
    return this.getNumberOfUnrevealedCells() == this.width * this.height;
  }

  // count the total number of unrevealed cells
  getNumberOfUnrevealedCells() {
    let numberOfUnrevealedCells = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        numberOfUnrevealedCells += Number(!this.board[x][y].isRevealed);
      }
    }
    return numberOfUnrevealedCells;
  }

  // canvas position -> grid position
  transpose(canvasX: number, canvasY: number): [number, number] {
    return [Math.floor(canvasX / this.cellSizeInCanvas), Math.floor(canvasY / this.cellSizeInCanvas)];
  }

  // return if coordinates are inside grid
  areValidCoordinates(x: number, y: number) {
    return 0 <= x && x < this.width && 0 <= y && y < this.height;
  }

  // set highlighted cell when not gameover or probability map is drawn
  highlight(context: CanvasRenderingContext2D, x: number, y: number) {
    if (this.drawProbabilityMap || this.gameStatus != GameStatus.Playing
      || (x == this.highlightedX && y == this.highlightedY)) {
      return;
    }
    if (this.areValidCoordinates(this.highlightedX, this.highlightedY)) {
      this.board[this.highlightedX][this.highlightedY].isHighlighted = false;
      this.board[this.highlightedX][this.highlightedY]
        .draw(context, this.highlightedX * this.cellSizeInCanvas, this.highlightedY * this.cellSizeInCanvas, this.cellSizeInCanvas);
    }
    if (!this.areValidCoordinates(x, y)) {
      this.highlightedX = this.highlightedY = -1;
      return;
    }
    this.highlightedX = x;
    this.highlightedY = y;
    this.board[x][y].isHighlighted = true;
    this.board[x][y].draw(context, x * this.cellSizeInCanvas, y * this.cellSizeInCanvas, this.cellSizeInCanvas);
  }

  // draw the gameboard (optional with probability map)
  draw(context: CanvasRenderingContext2D, width: number, height: number) {
    // unset highlight for probability map
    if (this.drawProbabilityMap && this.areValidCoordinates(this.highlightedX, this.highlightedY)) {
      this.board[this.highlightedX][this.highlightedY].isHighlighted = false;
      this.highlightedX = this.highlightedY = -1;
    }
    // draw grid
    this.cellSizeInCanvas = Math.floor(Math.min(width / this.width, (height / 1.1) / this.height));
    context.clearRect(0, 0, width, height);
    width = this.width * this.cellSizeInCanvas;
    height = this.height * this.cellSizeInCanvas;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.board[x][y].draw(context, x * this.cellSizeInCanvas, y * this.cellSizeInCanvas, this.cellSizeInCanvas, this.gameStatus != GameStatus.Playing);
      }
    }
    // mines remaining counter
    context.fillStyle = "black";
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = `${height * 0.06}px sans-serif`;
    context.fillText("Mines remaining: " + this.countRemainingMines(), width, height + height * 0.03);
    // gameover overlay
    if (this.gameStatus != GameStatus.Playing) {
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.fillRect(0, 0, width, height);

      let centerX = width / 2;
      let centerY = height / 2;

      context.fillStyle = "black";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `${height * 0.06}px sans-serif`;
      context.fillText(this.gameStatus, centerX, centerY - 0.05 * height);
      context.font = `${height * 0.03}px sans-serif`;
      context.fillText('(right-click to restart)', centerX, centerY + 0.025 * height);
    }

    if (this.drawProbabilityMap) {
      for (let [cell, mineProbability] of this.mineProbabilityMap) {
        let [x, y] = Utils.getCoordinates(cell, this.width);
        context.fillStyle = `rgba(0,0,0,${mineProbability / 2})`;
        context.fillRect(x * this.cellSizeInCanvas, y * this.cellSizeInCanvas, this.cellSizeInCanvas, this.cellSizeInCanvas);
        context.fillStyle = "black";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `${this.cellSizeInCanvas * 0.35}px sans-serif`;
        context.fillText(mineProbability.toFixed(2), (x + 0.5) * this.cellSizeInCanvas, (y + 0.53) * this.cellSizeInCanvas);
      }
    }
  }
}
