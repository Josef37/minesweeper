class Ruleset {
  rules: Set<Rule>;
  cellValues: Map<number, number>;

  constructor(rules: Set<Rule>) {
    this.rules = rules;
    this.cellValues = new Map();
    // TODO Optimize by only looking at affected cells and rules
  }

  calculateCellValues() {
    if (this.rules.size == 0) {
      return [];
    }
    let configurations = [];
    let firstCell = this.rules.values().next().value.cells[0]; // choose one cell belonging to a rule
    for (let value of [0, 1]) {
      this.cellValues = new Map();
      let newRuleset = this.setCellValue(firstCell, value);
      if (newRuleset != "invalid") {
        let subConfigurations = (<Ruleset>newRuleset).calculateCellValues();
        if (subConfigurations != "invalid") {
          configurations.push(new Configuration(<Configuration[]>subConfigurations, this.cellValues));
        }
      }
    }
    return configurations.length == 0 ? "invalid" : configurations;
  }

  // return the new set of rules after solving all rules, return "invalid" if there is a contradiction
  setCellValue(cell: number, value: number) {
    let cellValuesToApply = new Map([[cell, value]]),
      newRuleset: Ruleset | string = this;
    while (cellValuesToApply.size > 0) {
      [cell, value] = cellValuesToApply.entries().next().value;
      cellValuesToApply.delete(cell);
      this.cellValues.set(cell, value);

      newRuleset = this.applyRules(cell, value, (<Ruleset>newRuleset).rules);
      if (newRuleset == "invalid") {
        return "invalid";
      }
      let newSolvedCellValues =  (<Ruleset>newRuleset).getSolvedCellValues();
      if (newSolvedCellValues == "invalid") {
        return "invalid";
      }
      for ([cell, value] of newSolvedCellValues) {
        if (this.cellValues.has(cell) && this.cellValues.get(cell) != value) {
          return "invalid";
        }
        cellValuesToApply.set(cell, value);
      }
    }
    return newRuleset;
  }

  // return "invalid", if there is a contradiction to a rule
  applyRules(cell: number, value: number, rules: Set<Rule>) {
    let newRules = this.copyRules(rules);
    for (let newRule of newRules) {
      if (!newRule.updateRule(cell, value)) {
        return "invalid";
      }
      if (newRule.cells.length == 0) {
        newRules.delete(newRule);
      }
    }
    return new Ruleset(newRules);
  }

  // return "invalid", if there was a contradiction
  getSolvedCellValues() {
    let cellValues = new Map();
    for (let rule of this.rules) {
      if (rule.mineCount == 0) {
        for (let cell of rule.cells) {
          if (cellValues.has(cell) && cellValues.get(cell) != 0) {
            return "invalid";
          }
          cellValues.set(cell, 0);
        }
      } else if (rule.mineCount == rule.cells.length) {
        for (let cell of rule.cells) {
          if (cellValues.has(cell) && cellValues.get(cell) != 1) {
            return "invalid";
          }
          cellValues.set(cell, 1);
        }
      }
    }
    return cellValues;
  }

  copyRules(rules: Set<Rule>) {
    let copy = new Set();
    for (let rule of rules) {
      copy.add(rule.copy());
    }
    return copy;
  }

  [Symbol.iterator]() {
    return this.rules.values();
  }
}
