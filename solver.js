class Solver {
  constructor(gameboard) {
    this.gameboard = gameboard;
    this.rulesets = [];
    this.rulesetsFromGameboard();
    console.log(this);
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
    for(let x=0; x<this.gameboard.width; x++) {
      for(let y=0; y<this.gameboard.height; y++) {
        let cell = this.gameboard.board[x][y];
        if(!cell.isRevealed) {
          continue;
        }
        let mineCount = cell.mineCount,
            cells = [];
        this.gameboard.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
          if(!neighbour.isRevealed) {
            if(neighbour.isMarked) {
              mineCount--;
            } else {
              cells.push(neighbourX*this.gameboard.width + neighbourY);
            }
          }
        });
        if(cells.length > 0) {
          rules.push(new Rule(mineCount, cells));
        }
      }
    }
    return rules;
  }

  solve() {
    let {saveCells, mineCells} = this.solveWithoutLinkingRules();
    if(saveCells.size > 0 || mineCells.size > 0) {
      for(let cell of saveCells) {
        this.gameboard.doAction(...this.getCoordinates(cell));
      }
      for(let cell of mineCells) {
        this.gameboard.markCell(...this.getCoordinates(cell));
      }
    } else {
      this.solveWithLinkingRules();
    }
  }

  solveWithoutLinkingRules() {
    let saveCells = new Set(),
        mineCells = new Set();
    for(let ruleset of this.rulesets) {
      for(let rule of ruleset) {
        if(rule.mineCount == 0) {
          rule.cells.forEach(cell => saveCells.add(cell));
        }
        if(rule.mineCount == rule.cells.length) {
          rule.cells.forEach(cell => mineCells.add(cell));
        }
      }
    }
    return { saveCells: saveCells, mineCells: mineCells };
  }

  solveWithLinkingRules() {
    for(let ruleset of this.rulesets) {
      console.log(ruleset.calculateCellValues());
      // TODO Beachte ungeöffnete Minen außerhalb der Regeln
    }
  }

  getCoordinates(index) {
    let x = Math.floor(index / this.gameboard.width),
        y = index % this.gameboard.width;
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
      return "valid";
    }
    let configurations = [];

    let firstCell = this.rules.values().next().value.cells[0]; // choose one cell belonging to a rule
    for(let value of [0,1]) {
      this.cellValues = new Map();
      let newRuleset = this.setCellValue(firstCell, value);
      if(newRuleset != "invalid") {
        let configuration = newRuleset.calculateCellValues();
        if (configuration == "valid") {
          configurations.push(this.cellValues);
        } else if(configuration != "invalid") {
          configurations.push([this.cellValues, configuration]);
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
