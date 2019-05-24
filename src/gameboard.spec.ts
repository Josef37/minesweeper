import { Gameboard } from './gameboard';
import { Cell } from './cell';

let gameboard: Gameboard;

beforeEach(() => {
  gameboard = new Gameboard(5, 5, 5, false, 0);
});

test("board creation", () => {
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
  expect(coordinates).toEqual([[0,1],[1,0],[1,1]]);
});

test("action on neighbours on edge", () => {
  let coordinates: number[][] = [];
  gameboard.doForAllNeighbours(1, 0, (_neighbour, neighbourX, neighbourY) => coordinates.push([neighbourX, neighbourY]));
  expect(coordinates).toEqual([[0,0],[0,1],[1,1],[2,0],[2,1]]);
});

test("action on neighbours in center", () => {
  let coordinates: number[][] = [];
  gameboard.doForAllNeighbours(1, 1, (_neighbour, neighbourX, neighbourY) => coordinates.push([neighbourX, neighbourY]));
  expect(coordinates).toEqual([[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]]);
});

//doAction
test("don't auto reveal cells when number of flags is not the same", () => {
  gameboard.revealCell(1,1);
  let revealedCells = new Set();
  expect(gameboard.autoRevealCells(1, 1, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(0);
  gameboard.flagCell(0,0);
  gameboard.flagCell(1,0);
  expect(gameboard.autoRevealCells(1, 1, revealedCells)).toBe(false);
  expect(revealedCells.size).toBe(0);
});

test("auto reveal can lose you a game when flags are set wrong", () => {
  gameboard.revealCell(1,1);
  gameboard.flagCell(0,0);
  gameboard.flagCell(1,0);
  gameboard.flagCell(2,0);
  let revealedCells = new Set();
  expect(gameboard.autoRevealCells(1, 1, revealedCells)).toBe(true);
  expect(revealedCells.size).toBeGreaterThan(0);
});

test("auto reveal can start a cascade", () => {
  gameboard.revealCell(2,2);
  gameboard.flagCell(2,1);
  gameboard.flagCell(1,2);
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
  expect(gameboard.revealCell(2,0)).toBe(true);
});

test("remaining mines count", () => {
  gameboard.doAction(0,0);
  gameboard.flagCell(0,0);  // revealed
  gameboard.flagCell(2,0);  // not revealed
  expect(gameboard.countRemainingMines()).toBe(4);
});

test("valid coordinates check", () => {
  gameboard = new Gameboard(10, 5, 0);
  expect(gameboard.areValidCoordinates(0,0)).toBe(true);
  expect(gameboard.areValidCoordinates(9,0)).toBe(true);
  expect(gameboard.areValidCoordinates(0,4)).toBe(true);
  expect(gameboard.areValidCoordinates(9,4)).toBe(true);
  expect(gameboard.areValidCoordinates(-1,0)).toBe(false);
  expect(gameboard.areValidCoordinates(0,-1)).toBe(false);
  expect(gameboard.areValidCoordinates(10,0)).toBe(false);
  expect(gameboard.areValidCoordinates(0,5)).toBe(false);
});
