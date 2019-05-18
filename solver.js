class Solver {
  constructor(gameboard) {
    this.gameboard = gameboard;
    this.rulesets = [];
    this.rulesetsFromGameboard();
    this.action = { cellsToReveal: [0], cellsToMark: [] };
  }

  rulesetsFromGameboard() {
    let rules = this.rulesFromGameboard();
    if(rules.length == 0) {
      return [];
    }
    let undiscoveredCells = new Set();
    for(let rule of rules) {
      rule.cells.forEach(cell => undiscoveredCells.add(cell));
    }
    // Until each cell was discovered, collect the affected rules connected to that cell
    while (undiscoveredCells.size > 0) {
      let newCell = undiscoveredCells.values().next().value;
      undiscoveredCells.delete(newCell);
      let affectedRules = new Set(),
          cellsToCheck = [newCell];
      while(cellsToCheck.length > 0) {
        let cellToCheck = cellsToCheck.shift();
        for(let i=rules.length-1; i>=0; i--) {  // loop backwards because of element removal
          let rule = rules[i];
          if(rule.cells.includes(cellToCheck)) {  // rule is affeced
            rules.splice(rules.indexOf(rule), 1); // rules are distinct in one ruleset
            affectedRules.add(rule);
            let newCells = rule.cells.filter(x => undiscoveredCells.has(x));
            newCells.forEach(newCell => undiscoveredCells.delete(newCell));
            cellsToCheck = cellsToCheck.concat(newCells);
          }
        }
      }
      this.rulesets.push(new Ruleset(affectedRules));
    }
  }

  rulesFromGameboard() {
    let rules = [];
    let unrevealedCells = [];
    for(let x=0; x<this.gameboard.width; x++) {
      for(let y=0; y<this.gameboard.height; y++) {
        let cell = this.gameboard.board[x][y];
        if(!cell.isRevealed) {
          if(!cell.isMarked) {
            unrevealedCells.push(x*this.gameboard.height + y);
          }
          continue;
        }
        let mineCount = cell.mineCount,
            cells = [];
        this.gameboard.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
          if(!neighbour.isRevealed) {
            if(neighbour.isMarked) {
              mineCount--;
            } else {
              cells.push(neighbourX*this.gameboard.height + neighbourY);
            }
          }
        });
        if(cells.length > 0) {
          rules.push(new Rule(mineCount, cells));
        }
      }
    }
    rules.push(new Rule(this.gameboard.countRemainingMines(), unrevealedCells));
    return rules;
  }

  solve() {
    if(this.gameboard.isInitialState()) {
      this.doAction();
      return;
    }
    this.action = this.solveWithoutLinkingRules();
    if(this.action.cellsToReveal.size == 0 && this.action.cellsToMark.size == 0) {
      this.action = this.solveWithLinkingRules();
    }
    this.doAction();
  }

  doAction() {
    for(let cell of this.action.cellsToReveal) {
      this.gameboard.doAction(...this.getCoordinates(cell));
    }
    for(let cell of this.action.cellsToMark) {
      this.gameboard.markCell(...this.getCoordinates(cell));
    }
  }

  solveWithoutLinkingRules() {
    let action = { cellsToReveal: new Set(), cellsToMark: new Set() };
    for(let ruleset of this.rulesets) {
      for(let rule of ruleset) {
        if(rule.mineCount == 0) {
          rule.cells.forEach(cell => action.cellsToReveal.add(cell));
        }
        if(rule.mineCount == rule.cells.length) {
          rule.cells.forEach(cell => action.cellsToMark.add(cell));
        }
      }
    }
    return action;
  }

  solveWithLinkingRules() {
    let mineProbabilities = new Map();
    for(let ruleset of this.rulesets) {
      let configurations = new Configuration(ruleset.calculateCellValues(), new Map());
      let cellValuesSummed = new Map();
      let numberOfConfigurations = this.mineProbabilitiesInConfiguration(configurations, new Map(), cellValuesSummed, 0);
      cellValuesSummed.forEach((value, cell) => mineProbabilities.set(cell, value/numberOfConfigurations));
    }
    console.log("Probability map", mineProbabilities);
    return this.decideAction(mineProbabilities);
  }

  decideAction(mineProbabilities) {
    let action = { cellsToReveal: new Set(), cellsToMark: new Set() };
    let leastRisk = Math.min(...mineProbabilities.values());
    if(leastRisk > 0) {
      console.log("Now guessing with chance of failure of", leastRisk);
      for(let [cell, value] of mineProbabilities) {
        if(value == leastRisk) {
          action.cellsToReveal.add(cell);
          return action;
        }
      }
    }
    for(let [cell, value] of mineProbabilities) {
      if(value == 0) {
        action.cellsToReveal.add(cell);
      } else if (value == 1) {
        action.cellsToMark.add(cell);
      }
    }
    return action;
  }

  cellValuesInConfiguration(configurations, cellValues) {
    for(let [cell, value] of configurations.cellValues.entries()) {
      if(!cellValues.has(cell)) {
        cellValues.set(cell, value);
        continue;
      }
      if(cellValues.get(cell) != value) {
        cellValues.set(cell, "inconsistent");
      }
    }
    for(let configuration of configurations) {
      this.cellValuesInConfiguration(configuration, cellValues);
    }
  }

  mineProbabilitiesInConfiguration(configurations, cellValues, cellValuesSummed, numberOfConfigurations) {
    for(let [cell, value] of configurations.cellValues.entries()) {
      cellValues.set(cell, value);
    }
    if(configurations.isLast()) {
      for(let [cell, value] of cellValues.entries()) {
        cellValuesSummed.set(cell, value + (cellValuesSummed.get(cell) || 0));
      }
      return numberOfConfigurations+1;
    }
    for(let configuration of configurations) {
      numberOfConfigurations = this.mineProbabilitiesInConfiguration(configuration, cellValues, cellValuesSummed, numberOfConfigurations);
    }
    return numberOfConfigurations;
  }

  getCoordinates(index) {
    let x = Math.floor(index / this.gameboard.height),
        y = index % this.gameboard.height;
    return [x, y];
  }
}



class Ruleset {
  constructor(rules) {
    this.rules = rules;
    this.cellValues = new Map();
    // TODO Optimize by only looking at affected cells and rules
  }

  calculateCellValues() {
    if(this.rules.size == 0) {
      return [];
    }
    let configurations = [];
    let firstCell = this.rules.values().next().value.cells[0]; // choose one cell belonging to a rule
    for(let value of [0,1]) {
      this.cellValues = new Map();
      let newRuleset = this.setCellValue(firstCell, value);
      if(newRuleset != "invalid") {
        let subConfigurations = newRuleset.calculateCellValues();
        if(subConfigurations != "invalid") {
          configurations.push(new Configuration(subConfigurations, this.cellValues));
        }
      }
    }
    return configurations.size == 0 ? "invalid" : configurations;
  }

  // return the new set of rules after solving all rules, return "invalid" if there is a contradiction
  setCellValue(cell, value) {
    let cellValuesToApply = new Map([[cell, value]]),
        newRuleset = this;
    while(cellValuesToApply.size > 0) {
      [cell, value] = cellValuesToApply.entries().next().value;
      cellValuesToApply.delete(cell);
      this.cellValues.set(cell, value);

      newRuleset = this.applyRules(cell, value, newRuleset.rules);
      let newSolvedCellValues = newRuleset.getSolvedCellValues();
      if(newSolvedCellValues == "invalid") {
        return "invalid";
      }
      for([cell, value] of newSolvedCellValues) {
        if(this.cellValues.has(cell) && this.cellValues.get(cell) != value) {
          return "invalid";
        }
        cellValuesToApply.set(cell, value);
      }
    }
    return newRuleset;
  }

  applyRules(cell, value, rules) {
    let newRules = this.copyRules(rules);
    for(let newRule of newRules) {
      newRule.updateRule(cell, value);
      if(newRule.cells.length == 0) {
        newRules.delete(newRule);
      }
    }
    return new Ruleset(newRules);
  }

  // return "invalid", if there was a contradiction
  getSolvedCellValues() {
    let cellValues = new Map();
    for(let rule of this.rules) {
      if (rule.mineCount < 0 || rule.mineCount > rule.cells.length) {
        return "invalid";
      } else if(rule.mineCount == 0) {
        for(let cell of rule.cells) {
          if(cellValues.has(cell) && cellValues.get(cell) != 0) {
            return "invalid";
          }
          cellValues.set(cell, 0);
        }
      } else if(rule.mineCount == rule.cells.length) {
        for(let cell of rule.cells) {
          if(cellValues.has(cell) && cellValues.get(cell) != 1) {
            return "invalid";
          }
          cellValues.set(cell, 1);
        }
      }
    }
    return cellValues;
  }

  copyRules(rules) {
    let copy = new Set();
    for(let rule of rules) {
      copy.add(rule.copy());
    }
    return copy;
  }

  [Symbol.iterator]() {
    return this.rules.values();
  }
}



class Configuration {
  constructor(subConfigurations, cellValues) {
    this.subConfigurations = subConfigurations;
    this.cellValues = cellValues;
  }

  isLast() {
    return this.subConfigurations.length == 0;
  }

  [Symbol.iterator]() {
    return this.subConfigurations.values();
  }
}



class Rule {
  constructor(mineCount, cells) {
    this.mineCount = mineCount;
    this.cells = cells;
  }

  updateRule(cell, value) {
    let i = this.cells.indexOf(cell);
    if(i >= 0) {
      this.mineCount -= value;
      this.cells.splice(i, 1);
    }
  }

  copy() {
    return new Rule(this.mineCount, this.cells.slice());
  }
}
