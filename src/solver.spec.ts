import { Solver } from './solver';
import { Gameboard, GameStatus } from './gameboard';
import { Rule } from './rule';
import { Ruleset } from './ruleset';
import { Utils } from './utils';


test("in the beginning rulesets are empty", () => {
  let gameboard = new Gameboard(5, 5, 5, false, 0);
  let solver = new Solver(gameboard);
  expect(solver.rulesets).toHaveLength(0);
});

test("reads all visible rules from gameboard", () => {
  let gameboard = new Gameboard(5, 5, 5, false, 0);
  gameboard.doAction(0, 0);
  let solver = new Solver(gameboard);
  let expectedRules = [
    new Rule(1, [10, 11]),
    new Rule(2, [2, 7]),
    new Rule(3, [10, 11, 2, 7, 12])
  ];
  let computedRules = solver.rulesFromGameboard();
  expect(computedRules).toEqual(expect.arrayContaining(expectedRules));
  expect(expectedRules).toEqual(expect.arrayContaining(computedRules));
});

test("rulesets consider all rules and group them accordingly", () => {
  let gameboard = new Gameboard(5, 5, 5, false, 0);
  gameboard.doAction(0, 0);
  gameboard.doAction(4, 0);
  let solver = new Solver(gameboard); // rulesets get generated automatically

  expect(solver.rulesets).toEqual([
    new Ruleset(new Set([
      new Rule(3, [10, 11, 2, 7, 12]),
      new Rule(1, [10, 11]),
      new Rule(2, [2, 7])
    ])),
    new Ruleset(new Set([
      new Rule(2, [3, 8, 9])
    ]))
  ]);
});

test("actions are executed like expected", () => {
  let gameboard = new Gameboard(5, 5, 5, false, 0);
  let solver = new Solver(gameboard);
  solver.nextAction = { cellsToReveal: new Set([0, 4]), cellsToFlag: new Set([2, 3]) };
  solver.doAction();
  expect(gameboard.board[0][0].isRevealed).toBe(true);
  expect(gameboard.board[1][0].isRevealed).toBe(true);
  expect(gameboard.board[0][1].isRevealed).toBe(true);
  expect(gameboard.board[1][1].isRevealed).toBe(true);
  expect(gameboard.board[4][0].isRevealed).toBe(true);
  expect(gameboard.board[2][0].isFlagged).toBe(true);
  expect(gameboard.board[3][0].isFlagged).toBe(true);
});

test("when there are clear cells, solver acts on all of them", () => {
  let gameboard = new Gameboard(5, 5, 5, false, 0);
  let solver = new Solver(gameboard);
  let mineProbabilityMap = new Map([[0, 0], [1, 1], [2, 0.5], [3, 0.5], [4, 0]]);
  expect(solver.decideNextAction(mineProbabilityMap))
    .toEqual({ cellsToReveal: new Set([0, 4]), cellsToFlag: new Set([1]) });
});

test("when there is no clear cell, solver chooses least risk cell with highest priority", () => {
  let gameboard = new Gameboard(5, 5, 5, false, 0);
  let solver = new Solver(gameboard);
  let mineProbabilityMap = new Map([[1, 0.1], [2, 0.2], [3, 1], [4, 0.5], [0, 0.1]]);
  expect(solver.decideNextAction(mineProbabilityMap))
    .toEqual({ cellsToReveal: new Set([0]), cellsToFlag: new Set() });
});

test("all mine probabilities summed result in number of remaining mines", () => {
  let gameboard = new Gameboard(10, 10, 10);
  while (gameboard.gameStatus == GameStatus.Playing) {
    let solver = new Solver(gameboard);
    let summedProbabilities = Array.from(solver.mineProbabilityMap.values()).reduce((acc, val) => acc + val);
    expect(summedProbabilities).toBeCloseTo(solver.numberOfRemainingMines);
    solver.solve();
  }
});

test("compute mine probability map", () => {
  // TODO
});

test("generate mine probability map", () => {
  // TODO
});

// the estimated survial rate doesn't approach the number of wins, because after losing, you would have to take more risks until winning
test("the probability map is right for cells in rules, when averaged over many games", () => {
  let gameboard = new Gameboard(5, 5, 5, false);
  let iterations = 1000;
  let summedMines = new Map();
  let assumedMines = new Map();
  for (let i = 0; i < iterations; i++) {
    while (gameboard.gameStatus == GameStatus.Playing) {
      let solver = new Solver(gameboard);
      solver.rulesets.map(ruleset => Array.from(ruleset.rules).map(rule => rule.cells))
      let frontline = new Set();
      solver.rulesets.forEach(ruleset => ruleset.rules.forEach(rule => rule.cells.forEach(cell => frontline.add(cell))));
      for (let cell of frontline) {
        let [x, y] = Utils.getCoordinates(cell, gameboard.width);
        summedMines.set(cell, Number(gameboard.board[x][y].hasMine) + (summedMines.get(cell) || 0));
        assumedMines.set(cell, solver.mineProbabilityMap.get(cell) + (assumedMines.get(cell) || 0))
      }
      solver.solve();
    }
    gameboard.reset();
  }
  for (let cell of summedMines.keys()) {
    expect(summedMines.get(cell) / iterations).toBeCloseTo(assumedMines.get(cell) / iterations, 1);
  }
});

test("naive solver has same results as not naive", () => {
  for (let size of [2, 3, 4, 5]) {
    let gameboard = new Gameboard(size, size, size, false);
    while (gameboard.gameStatus == GameStatus.Playing) {
      let naiveSolver = new Solver(gameboard, true);
      let solver = new Solver(gameboard);
      for (let key of solver.mineProbabilityMap.keys()) {
        expect(naiveSolver.mineProbabilityMap.get(key)).toBeCloseTo(solver.mineProbabilityMap.get(key));
      }
      solver.solve();
    }
  }
});
