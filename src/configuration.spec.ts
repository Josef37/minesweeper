import { Configuration } from './configuration';

let configuration: Configuration;

beforeEach(() => {
  configuration = new Configuration(
    [
      new Configuration([
        new Configuration([], new Map([[3, 0]])),
        new Configuration([], new Map([[3, 1]]))
      ], new Map([[2, 0]])),
      new Configuration([], new Map([[2, 1], [3, 0]])),
    ], new Map([[1, 0]]));
});

test("acting on all configurations lists all configurations", () => {
  let cellValuesList: Map<number, number>[] = [];
  configuration.actOnAllConfigurations(allCellValues => cellValuesList.push(new Map(allCellValues)));
  expect(cellValuesList).toEqual([
    new Map([[1, 0], [2, 0], [3, 0]]),
    new Map([[1, 0], [2, 0], [3, 1]]),
    new Map([[1, 0], [2, 1], [3, 0]])
  ])
});

test("mine probability is computed correctly", () => {
  let [numberOfMinesToProbabilityMap, combinationsPerNumberOfMines] = configuration.mineProbabilitiesPerNumberOfMines();
  expect(numberOfMinesToProbabilityMap).toEqual(new Map([
    [0, new Map([[1, 0], [2, 0], [3, 0]])],
    [1, new Map([[1, 0], [2, 0.5], [3, 0.5]])]
  ]));
  expect(combinationsPerNumberOfMines).toEqual(new Map([[0, 1], [1, 2]]));
});
