// representation of a valid mine configuration/distribution
// each instance stores a coherent part of a complete configuration and links to its successors
// by traversing the resulting tree structure, all distributions can be obtainend
export class Configuration {
  constructor(public subConfigurations: Configuration[],
    // cell values in this part of a complete configuration
    // cells have to occur exactly once in a path in the configuration tree:
    // - if there is a duplicate, the later will overwrite the first value
    // - if a cell occurs in one path, but not the other, the second result will have that cell anyway
    public cellValues: Map<number, number>) {}

  // indicates that there is no further configuration
  isLast() {
    return this.subConfigurations.length == 0;
  }

  // iterate over subConfigurations
  [Symbol.iterator]() {
    return this.subConfigurations.values();
  }

  // perform callback on every possible complete configuration
  actOnAllConfigurations(callback: (allCellValues: Map<number, number>) => any, allCellValues: Map<number, number> = new Map()) {
    this.cellValues.forEach((value, key) => allCellValues.set(key, value));
    if(this.isLast()) {
      callback(allCellValues);
      return;
    }
    for(let subConfiguration of this.subConfigurations) {
      subConfiguration.actOnAllConfigurations(callback, allCellValues);
    }
  }

  // for all configurations return map from number of mines in configuration to mine probability and number of configurations
  mineProbabilitiesPerNumberOfMines(): [Map<number, Map<number, number>>, Map<number, number>] {
    let numberOfMinesToSummedValues: Map<number, Map<number, number>> = new Map();
    let combinationsPerNumberOfMines: Map<number, number> = new Map();

    // map from mines in configuration to summed values and accumulate number of combinations
    this.actOnAllConfigurations((cellValues: Map<number, number>) => {
      let minesInConfiguration = 0;
      cellValues.forEach(value => minesInConfiguration += value);
      if (!numberOfMinesToSummedValues.has(minesInConfiguration)) {
        numberOfMinesToSummedValues.set(minesInConfiguration, new Map());
        combinationsPerNumberOfMines.set(minesInConfiguration, 0);
      }
      let cellValuesSummed = numberOfMinesToSummedValues.get(minesInConfiguration);
      for (let [cell, value] of cellValues.entries()) {
        cellValuesSummed.set(cell, value + (cellValuesSummed.get(cell) || 0));
      }
      combinationsPerNumberOfMines.set(minesInConfiguration, 1 + combinationsPerNumberOfMines.get(minesInConfiguration));
    });

    // divide by number of combinations to get probability
    let numberOfMinesToProbabilityMap = numberOfMinesToSummedValues;
    for (let [numberOfMines, summedNumberOfMinesMap] of numberOfMinesToProbabilityMap) {
      let combinations = combinationsPerNumberOfMines.get(numberOfMines);
      summedNumberOfMinesMap.forEach((value: number, cell: number) => summedNumberOfMinesMap.set(cell, value / combinations));
    }

    return [numberOfMinesToProbabilityMap, combinationsPerNumberOfMines];
  }
}
