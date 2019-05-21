// solving one specific gameboard by calculating mine probabilities for every cell
// in the solving domain, cells are always identified by index, not coordinates
class Solver {
  rulesets: Ruleset[] = [];
  unclearCellsWithoutRule: Set<number> = new Set();
  numberOfRemainingMines: number;

  constructor(public gameboard: Gameboard,
    public nextAction = { cellsToReveal: new Set([0]), cellsToFlag: new Set() }) {
    this.numberOfRemainingMines = gameboard.countRemainingMines();
    this.generateRulesetsFromGameboard();
  }

  // collect rules into distinct sets, so these sets do not share any cell
  // if rules are connected through their cells, a ruleset is a connected component in that graph
  generateRulesetsFromGameboard() {
    let rules = this.rulesFromGameboard();
    if (rules.length == 0) {
      return;
    }
    let undiscoveredCells: Set<number> = new Set(rules.flatMap(rule => rule.cells));
    // Until each cell was discovered, collect the affected rules connected to that cell
    while (undiscoveredCells.size > 0) {
      let undiscoveredCell: number = undiscoveredCells.values().next().value;
      undiscoveredCells.delete(undiscoveredCell);
      let affectedRules: Set<Rule> = new Set();
      let cellsToCheckForChange: number[] = [undiscoveredCell];
      while (cellsToCheckForChange.length > 0) {
        let cellToCheck = cellsToCheckForChange.shift();
        for (let i = rules.length - 1; i >= 0; i--) {  // loop backwards because of element removal
          let rule = rules[i];
          if (rule.cells.includes(cellToCheck)) {   // rule is connected
            rules.splice(rules.indexOf(rule), 1);   // rules are only in one ruleset
            affectedRules.add(rule);
            let newUndiscoveredCells = rule.cells.filter((cell: number) => undiscoveredCells.has(cell));
            newUndiscoveredCells.forEach((newCell: number) => undiscoveredCells.delete(newCell));
            cellsToCheckForChange = cellsToCheckForChange.concat(newUndiscoveredCells);
          }
        }
      }
      this.rulesets.push(new Ruleset(affectedRules));
    }
  }

  // return all visible rules as an array
  rulesFromGameboard(): Rule[] {
    let rules = [];
    this.unclearCellsWithoutRule = this.getUnclearCells();
    for (let x = 0; x < this.gameboard.width; x++) {
      for (let y = 0; y < this.gameboard.height; y++) {
        let cell = this.gameboard.board[x][y];
        if (!cell.isRevealed) {
          continue;
        }
        let numberOfMinesInRule = cell.numberOfAdjacentMines;
        let cellsInRule: number[] = [];
        this.gameboard.doForAllNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
          if (!neighbour.isRevealed && neighbour.isFlagged) {
            numberOfMinesInRule--;
          } else if (!neighbour.isRevealed && !neighbour.isFlagged) {
            let neighbourIndex = Utils.getIndex(neighbourX, neighbourY, this.gameboard.width);
            cellsInRule.push(neighbourIndex);
            this.unclearCellsWithoutRule.delete(neighbourIndex);
          }
        });
        if (cellsInRule.length > 0) {
          rules.push(new Rule(numberOfMinesInRule, cellsInRule));
        }
      }
    }
    return rules;
  }

  // return a set of all cells that are not revealed or flagged
  getUnclearCells(): Set<number> {
    let unclearCells = new Set();
    for (let x = 0; x < this.gameboard.width; x++) {
      for (let y = 0; y < this.gameboard.height; y++) {
        let cell = this.gameboard.board[x][y];
        if (!cell.isRevealed && !cell.isFlagged) {
          unclearCells.add(Utils.getIndex(x, y, this.gameboard.width));
        }
      }
    }
    return unclearCells;
  }

  // compute and execute action
  solve() {
    this.computeAction();
    this.doAction();
  }

  // compute the next action to take
  computeAction() {
    if (this.gameboard.isInitialState()) {
      return;
    }
    this.nextAction = this.decideAction(this.computeProbabilityMap()); // TODO only calculate once
  }

  // reveal and flag cells given by next action
  doAction() {
    for (let cell of this.nextAction.cellsToReveal) {
      this.gameboard.doAction(...Utils.getCoordinates(cell, this.gameboard.width));
    }
    for (let cell of this.nextAction.cellsToFlag) {
      this.gameboard.flagCell(...Utils.getCoordinates(cell, this.gameboard.width));
    }
  }

  // compute map: cell -> probability it contains a mine
  computeProbabilityMap(): Map<number, number> {
    let mineProbabilityMap: Map<number, number> = new Map();
    // for each ruleset: map from number of mines in the configurations to the probability of a cell containing a mine (while configuration has given number of mines)
    let numberOfMinesToProbabilityMapByRulesets: Map<number, Map<number, number>>[] = [];
    // for each ruleset: map from number of mines to the number of valid configurations containing that number of mines
    let combinationsPerNumberOfMinesByRulesets: Map<number, number>[] = [];
    for (let ruleset of this.rulesets) {
      // ruleset.computeConfigurations() doesn't return "invalid", because there is always at least one valid configuration
      let configurations = new Configuration(<Configuration[]>ruleset.computeConfigurations(), new Map());
      let [numberOfMinesToProbabilityMaps, combinationsPerNumberOfMines] = this.mineProbabilitiesInConfigurationsPerNumberOfMines(configurations);
      numberOfMinesToProbabilityMapByRulesets.push(numberOfMinesToProbabilityMaps);
      combinationsPerNumberOfMinesByRulesets.push(combinationsPerNumberOfMines);
    }
    let totalCombinations = this.generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, new Map(), mineProbabilityMap);
    mineProbabilityMap.forEach((value, cell) => mineProbabilityMap.set(cell, value / totalCombinations));
    return mineProbabilityMap;
  }

  // for all configurations return map from number of mines in configuration to mine probability and number of configurations
  mineProbabilitiesInConfigurationsPerNumberOfMines(configurations: Configuration): [Map<number, Map<number, number>>, Map<number, number>] {
    let numberOfMinesToSummedValues: Map<number, Map<number, number>> = new Map();
    let combinationsPerNumberOfMines: Map<number, number> = new Map();

    // map from mines in configuration to summed values and accumulate number of combinations
    configurations.actOnAllConfigurations((cellValues: Map<number, number>) => {
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
    let numberOfMinesToProbabilityMaps = numberOfMinesToSummedValues;
    for (let [numberOfMines, summedNumberOfMinesMap] of numberOfMinesToProbabilityMaps) {
      let combinations = combinationsPerNumberOfMines.get(numberOfMines);
      summedNumberOfMinesMap.forEach((value: number, cell: number) => summedNumberOfMinesMap.set(cell, value / combinations));
    }

    return [numberOfMinesToProbabilityMaps, combinationsPerNumberOfMines];
  }

  // piece together all probability maps and weight by number of possible configurations
  // return the total number of valid configurations
  generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets: Map<number, Map<number, number>>[],
    combinationsPerNumberOfMinesByRulesets: Map<number, number>[],
    currentCellValues: Map<number, number>,
    summedCellValues: Map<number, number>,
    rulesetIndex = 0, currentCombinations = 1, totalCombinations = 0, minesInConfiguration = 0) {
    if (rulesetIndex == numberOfMinesToProbabilityMapByRulesets.length) {   // complete configuration generated
      let minesNotInConfiguration = this.numberOfRemainingMines - minesInConfiguration;
      currentCombinations *= Utils.choose(this.unclearCellsWithoutRule.size, minesNotInConfiguration);  // distribute remaining mines equally to "unruled" cells // TODO what to do about binomials getting huge?
      currentCellValues.forEach((value, cell) => summedCellValues.set(cell, value * currentCombinations + (summedCellValues.get(cell) || 0)));  // weight by number of configurations
      this.unclearCellsWithoutRule.forEach(cell => summedCellValues.set(cell, minesNotInConfiguration / this.unclearCellsWithoutRule.size * currentCombinations + (summedCellValues.get(cell) || 0)));
      return totalCombinations + currentCombinations;
    }
    for (let [mineCount, mineProbabilityMap] of numberOfMinesToProbabilityMapByRulesets[rulesetIndex]) {
      mineProbabilityMap.forEach((value, cell) => currentCellValues.set(cell, value));
      let combinations = combinationsPerNumberOfMinesByRulesets[rulesetIndex].get(mineCount);
      totalCombinations = this.generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, currentCellValues, summedCellValues, rulesetIndex + 1, currentCombinations * combinations, totalCombinations, minesInConfiguration + mineCount);
    }
    return totalCombinations;
  }

  // TODO When unsafe, consider opening corners first (or any other rule)
  // Given the probability of cell containing mines, compute action to take next
  decideAction(mineProbabilityMap: Map<number, number>) {
    let action = { cellsToReveal: new Set(), cellsToFlag: new Set() };
    let leastRisk = Math.min(...mineProbabilityMap.values());
    if (leastRisk > 0) { // open only one cell with least mine probability
      console.log("Now guessing with chance of failure of", leastRisk);
      console.log("Survial chance up to this point", this.gameboard.chanceOfSurvial *= (1 - leastRisk));
      for (let [cell, value] of mineProbabilityMap) {
        if (Math.abs(value - leastRisk) < Number.EPSILON) {
          action.cellsToReveal.add(cell);
          return action;
        }
      }
    }
    for (let [cell, value] of mineProbabilityMap) {
      if (Math.abs(value - 0) < Number.EPSILON) {
        action.cellsToReveal.add(cell);
      } else if (Math.abs(value - 1) < Number.EPSILON) {
        action.cellsToFlag.add(cell);
      }
    }
    return action;
  }
}
