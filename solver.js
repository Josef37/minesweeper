class Solver {
  constructor(gameboard) {
    this.rulesets = Solver.rulesetsFromGameboard(gameboard);
  }

  static rulesetsFromGameboard(gameboard) {
    let rules = Solver.rulesFromGameboard(gameboard);
    if(rules.length == 0) {
      return [];
    }
    let ruleset = [],
        undiscoveredCells = new Set();
    for(let rule of rules) {
      rule.cells.forEach(cell => undiscoveredCells.add(cell));
    }
    while (undiscoveredCells.size > 0) {
      let newCell = undiscoveredCells.values().next().value;
      undiscoveredCells.delete(newCell);
      let affectedCells = new Set([newCell]),
          affectedRules = new Set(),
          cellsToCheck = [newCell];
      while(cellsToCheck.length > 0) {
        let cellToCheck = cellsToCheck.shift();
        for(let i=rules.length-1; i>=0; i--) {
          let rule = rules[i];
          if(rule.cells.includes(cellToCheck)) {
            rules.splice(rules.indexOf(rule), 1);
            affectedRules.add(rule);
            let newCells = rule.cells.filter(x => !affectedCells.has(x));
            newCells.forEach(newCell => affectedCells.add(newCell));
            newCells.forEach(newCell => undiscoveredCells.delete(newCell));
            cellsToCheck = cellsToCheck.concat(newCells);
          }
        }
      }
      ruleset.push(affectedRules);
    }
    return ruleset;
  }

  static rulesFromGameboard(gameboard) {
    let rules = [];
    for(let x=0; x<gameboard.width; x++) {
      for(let y=0; y<gameboard.height; y++) {
        let cell = gameboard.board[x][y];
        if(!cell.isRevealed) {
          continue;
        }
        let mineCount = cell.mineCount,
            cells = [];
        gameboard.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
          if(!neighbour.isRevealed) {
            if(neighbour.isMarked) {
              mineCount--;
            } else {
              cells.push(neighbourX*gameboard.width + neighbourY);
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
}

class Rule {
  constructor(mineCount, cells) {
    this.mineCount = mineCount;
    this.cells = cells;
  }
}
