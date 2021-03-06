import { Gameboard } from "./gameboard";
import { Utils } from "./utils";
import { Ruleset } from "./ruleset";
import { Rule } from "./rule";
import { Configuration } from "./configuration";

// solving one specific gameboard by calculating mine probabilities for every cell
// in the solving domain, cells are always identified by index, not coordinates
export class Solver {
  rulesets: Ruleset[] = [];
  unclearCellsWithoutRule: Set<number> = new Set();
  numberOfRemainingMines: number;
  mineProbabilityMap: Map<number, number>;
  cellsByPriority: number[];
  nextAction: { cellsToReveal: any; cellsToFlag: any; };

  // add a comprehensive rule to cover all remaining mines (for testing purposes)
  constructor(public gameboard: Gameboard, public addComprehensiveRule = false) {
    this.numberOfRemainingMines = gameboard.countRemainingMines();
    this.generateRulesetsFromGameboard();
    this.mineProbabilityMap = this.computeProbabilityMap();
    this.cellsByPriority =  // corner cells
      [0, gameboard.width - 1, gameboard.width * (gameboard.height - 1), gameboard.width * gameboard.height - 1];
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
    this.unclearCellsWithoutRule = this.gameboard.getUnclearCellIndices();
    this.gameboard.doForAllCells((cell, x, y) => {
      if (!cell.isRevealed) {
        return;
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
    });
    if (this.addComprehensiveRule) {
      let unrevealedCells = [];
      this.gameboard.doForAllCells((cell, x, y) => {
        if (!cell.isRevealed && !cell.isFlagged)
          unrevealedCells.push(Utils.getIndex(x, y, this.gameboard.width));
      });
      rules.push(new Rule(this.numberOfRemainingMines, unrevealedCells));
    }
    return rules;
  }

  // compute and execute action
  solve() {
    this.nextAction = this.decideNextAction(this.mineProbabilityMap);
    this.doAction();
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
      let [numberOfMinesToProbabilityMaps, combinationsPerNumberOfMines] = configurations.mineProbabilitiesPerNumberOfMines();
      numberOfMinesToProbabilityMapByRulesets.push(numberOfMinesToProbabilityMaps);
      combinationsPerNumberOfMinesByRulesets.push(combinationsPerNumberOfMines);
    }
    // compute lower bound k for reducing binomial coefficient (minimum number of "unruled" cells with mine or without mine)
    let minimalMinesNotInConfiguration: number = this.gameboard.totalNumberOfMines;
    if (combinationsPerNumberOfMinesByRulesets.length > 0) {
      minimalMinesNotInConfiguration = Math.max(0,
        Math.min(
          // minimum with mine
          this.numberOfRemainingMines - combinationsPerNumberOfMinesByRulesets.map(combinations => Math.max(...combinations.keys())).reduce((acc, val) => acc + val),
          // minimum without mine
          this.unclearCellsWithoutRule.size - (this.numberOfRemainingMines - combinationsPerNumberOfMinesByRulesets.map(combinations => Math.min(...combinations.keys())).reduce((acc, val) => acc + val))
        )
      );
    }
    let totalCombinations = this.generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, new Map(), mineProbabilityMap, minimalMinesNotInConfiguration);
    mineProbabilityMap.forEach((value, cell) => mineProbabilityMap.set(cell, value / totalCombinations));
    return mineProbabilityMap;
  }

  // piece together all probability maps and weight by number of possible configurations
  // return the total number of valid configurations
  generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets: Map<number, Map<number, number>>[],
    combinationsPerNumberOfMinesByRulesets: Map<number, number>[],
    currentCellValues: Map<number, number>,
    summedCellValues: Map<number, number>,
    minimalMinesNotInConfiguration: number,
    rulesetIndex = 0, currentCombinations = 1, totalCombinations = 0, minesInConfiguration = 0) {
    if (rulesetIndex == numberOfMinesToProbabilityMapByRulesets.length) {   // complete configuration generated
      let minesNotInConfiguration = this.numberOfRemainingMines - minesInConfiguration;
      currentCombinations *= Utils.reducedBinomial(this.unclearCellsWithoutRule.size, minesNotInConfiguration, minimalMinesNotInConfiguration);  // distribute remaining mines equally to "unruled" cells
      currentCellValues.forEach((value, cell) => summedCellValues.set(cell, value * currentCombinations + (summedCellValues.get(cell) || 0)));  // weight by number of configurations
      this.unclearCellsWithoutRule.forEach(cell => summedCellValues.set(cell, minesNotInConfiguration / this.unclearCellsWithoutRule.size * currentCombinations + (summedCellValues.get(cell) || 0)));
      return totalCombinations + currentCombinations;
    }
    for (let [mineCount, mineProbabilityMap] of numberOfMinesToProbabilityMapByRulesets[rulesetIndex]) {
      mineProbabilityMap.forEach((value, cell) => currentCellValues.set(cell, value));
      let combinations = combinationsPerNumberOfMinesByRulesets[rulesetIndex].get(mineCount);
      totalCombinations = this.generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, currentCellValues, summedCellValues, minimalMinesNotInConfiguration, rulesetIndex + 1, currentCombinations * combinations, totalCombinations, minesInConfiguration + mineCount);
    }
    return totalCombinations;
  }

  // TODO When unsafe, consider opening corners first (or any other rule)
  // Given the probability of cell containing mines, compute action to take next
  decideNextAction(mineProbabilityMap: Map<number, number>) {
    let action = { cellsToReveal: new Set(), cellsToFlag: new Set() };
    let leastRisk = Math.min(...mineProbabilityMap.values());
    if (Math.abs(leastRisk) > Number.EPSILON) { // open only one cell with least mine probability
      if (!(this.gameboard.isSaveFirstAction && this.gameboard.isInitialState())) {
        console.log("Now guessing with chance of failure of", leastRisk);
        console.log("Survial chance up to this point", this.gameboard.chanceOfSurvial *= (1 - leastRisk));
      }
      let leastRiskCells = new Set();
      for (let [cell, value] of mineProbabilityMap) {
        if (Math.abs(value - leastRisk) < Number.EPSILON) {
          leastRiskCells.add(cell);
        }
      }
      for (let cell of this.cellsByPriority) {   // select priority cells
        if (leastRiskCells.has(cell)) {
          action.cellsToReveal.add(cell);
          return action;
        }
      }
      action.cellsToReveal.add(leastRiskCells.values().next().value);   // select anything else
      return action;
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
