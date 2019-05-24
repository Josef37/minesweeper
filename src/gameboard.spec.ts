import { Gameboard, GameStatus } from './gameboard';
import { Cell } from './cell';

let gameboard: Gameboard;

beforeEach(() => {
  gameboard = new Gameboard(5, 5, 5, false, 0);
});

test("board creation is consistent with seed", () => {
  let mines = gameboard.board.map((column: Cell[]) => column.map((cell: Cell) => cell.hasMine));
  // mirrored on main diagonal, because x is first coordinate in array
  expect(mines).toEqual([
    [false, false, false, false, false],
    [false, false, true, false, false],
    [true, true, false, false, false],
    [true, false, false, false, false],
    [false, true, false, false, false]
  ]);
});

test("board creation is random over 10000 samples (probability matches first digit)", () => {
  let width = 10;
  let height = 10;
  let numberOfMinesPerGameboard = 50;
  let iterations = 10000;
  let sumOfMines: number[][] = [];
  for (let x = 0; x < width; x++) {
    sumOfMines[x] = [];
    for (let y = 0; y < height; y++) {
      sumOfMines[x][y] = 0;
    }
  }
  for (let seed = 0; seed < iterations; seed++) {
    gameboard = new Gameboard(width, height, numberOfMinesPerGameboard, false, seed);
    gameboard.doForAllCells((cell, x, y) => {
      sumOfMines[x][y] += Number(cell.hasMine);
    });
  }
  gameboard.doForAllCells((_cell, x, y) => {
    expect(sumOfMines[x][y] / iterations).toBeCloseTo(numberOfMinesPerGameboard / (width * height), 1);
  });
});

test("save board creation has no mine but count is matching", () => {
  gameboard = new Gameboard(10, 10, 50, true);
  gameboard.createBoardSave(5, 5);
  expect(gameboard.board[5][5].hasMine).toBe(false);
  let numberOfMines = 0;
  gameboard.board.forEach((column: Cell[]) =>
    column.forEach((cell: Cell) => numberOfMines += Number(cell.hasMine)));
  expect(numberOfMines).toBe(50);
});

test("action on neighbours in corner", () => {
  let coordinates: number[][] = [];
  gameboard.doForAllNeighbours(0, 0, (_neighbour, neighbourX, neighbourY) => coordinates.push([neighbourX, neighbourY]));
  expect(coordinates).toEqual([[0, 1], [1, 0], [1, 1]]);
});

test("action on neighbours on edge", () => {
  let coordinates: number[][] = [];
  gameboard.doForAllNeighbours(1, 0, (_neighbour, neighbourX, neighbourY) => coordinates.push([neighbourX, neighbourY]));
  expect(coordinates).toEqual([[0, 0], [0, 1], [1, 1], [2, 0], [2, 1]]);
});

test("action on neighbours in center", () => {
  let coordinates: number[][] = [];
  gameboard.doForAllNeighbours(1, 1, (_neighbour, neighbourX, neighbourY) => coordinates.push([neighbourX, neighbourY]));
  expect(coordinates).toEqual([[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]]);
});

test("no action performed when gameover, coordinates invalid or clicked flagged cell", () => {
  gameboard.flagCell(0, 0);
  expect(gameboard.doAction(0, 0)).toBe(false);
  expect(gameboard.doAction(-1, 0)).toBe(false);
  gameboard.doAction(2, 0); // mine revealed
  expect(gameboard.doAction(1, 1)).toBe(false);
});

test("lose game on mine revealing", () => {
  expect(gameboard.gameStatus).toEqual(GameStatus.Playing);
  gameboard.doAction(2, 0);
  expect(gameboard.gameStatus).toEqual(GameStatus.Lost);
});

test("win game when only mines left", () => {
  for (let [x, y] of [[0, 0], [4, 0], [3, 1], [0, 2], [4, 4]]) {
    expect(gameboard.gameStatus).toEqual(GameStatus.Playing);
    gameboard.doAction(x, y);
  }
  expect(gameboard.gameStatus).toEqual(GameStatus.Won);
});

test("do nothing when clicking a second time", () => {
  expect(gameboard.doAction(0, 0)).toBe(true);
  expect(gameboard.doAction(0, 0)).toBe(false);
  expect(gameboard.doAction(0, 2)).toBe(true);
  expect(gameboard.doAction(0, 2)).toBe(false);
});

test("don't auto reveal cells when number of flags is not the same", () => {
  gameboard.revealCell(1, 1);
  let revealedCells = new Set();
  expect(gameboard.autoRevealCells(1, 1, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(0);
  gameboard.flagCell(0, 0);
  gameboard.flagCell(1, 0);
  expect(gameboard.autoRevealCells(1, 1, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(0);
});

test("auto reveal can lose you a game when flags are set wrong", () => {
  gameboard.revealCell(1, 1);
  gameboard.flagCell(0, 0);
  gameboard.flagCell(1, 0);
  gameboard.flagCell(2, 0);
  let revealedCells = new Set();
  expect(gameboard.autoRevealCells(1, 1, revealedCells)).toBe(true);
  expect(revealedCells.size).toBeGreaterThan(0);
});

test("auto reveal can start a cascade", () => {
  gameboard.revealCell(2, 2);
  gameboard.flagCell(2, 1);
  gameboard.flagCell(1, 2);
  let revealedCells = new Set();
  expect(gameboard.autoRevealCells(2, 2, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(14);
});

test("reveal cascade when number of adjacent mines is 0", () => {
  let revealedCells = new Set();
  expect(gameboard.revealCell(4, 4, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(13);
});

test("reveal only one cell when number of adjacent mines is greater than 0", () => {
  let revealedCells = new Set();
  expect(gameboard.revealCell(1, 0, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(1);
});

test("detect that mine was revealed", () => {
  expect(gameboard.revealCell(2, 0)).toBe(true);
});

test("remaining mines count", () => {
  gameboard.doAction(0, 0);
  gameboard.flagCell(0, 0);  // revealed
  gameboard.flagCell(2, 0);  // not revealed
  expect(gameboard.countRemainingMines()).toBe(4);
});

test("unclear cells indices are detected correctly", () => {
  gameboard.doAction(4, 4);
  gameboard.flagCell(0, 2);
  gameboard.flagCell(1, 2);
  expect(gameboard.getUnclearCellIndices()).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
});

test("valid coordinates check", () => {
  gameboard = new Gameboard(10, 5, 0);
  expect(gameboard.areValidCoordinates(0, 0)).toBe(true);
  expect(gameboard.areValidCoordinates(9, 0)).toBe(true);
  expect(gameboard.areValidCoordinates(0, 4)).toBe(true);
  expect(gameboard.areValidCoordinates(9, 4)).toBe(true);
  expect(gameboard.areValidCoordinates(-1, 0)).toBe(false);
  expect(gameboard.areValidCoordinates(0, -1)).toBe(false);
  expect(gameboard.areValidCoordinates(10, 0)).toBe(false);
  expect(gameboard.areValidCoordinates(0, 5)).toBe(false);
});
