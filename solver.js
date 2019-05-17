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
      ruleset.getProbability();
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
    this.cellToRules = new Multimap();
    for(let rule of this.rules) {
      rule.cells.forEach(cell => this.cellToRules.set(cell, rule));
    }
  }

  // TODO Rename
  getProbability() {
    let values = new Map();
    for(let cell of this.cellToRules.keys()) {
      values.set(cell, null);
    }
    let firstCell = values.keys().next().value;
    values.set(firstCell, 0);
    applyRules(values, this.cellToRules.get(firstCell));
    values.set(firstCell, 1);
  }

  // TODO Find a way for rules to incorporate the fixed values
  applyRules(values, rules) {

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
}
