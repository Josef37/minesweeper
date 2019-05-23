import { Configuration } from "./configuration";
import { Rule } from "./rule";

// representation of a set of connected rules
// TODO Optimize by only looking at affected cells and rules
export class Ruleset {
  constructor(public rules: Set<Rule>) { }

  // computes all possible configuration satisfying this set of rules
  computeConfigurations(): Configuration[] | "invalid" {
    if (this.rules.size == 0) {
      return [];
    }
    let configurations = [];
    let firstCell = this.rules.values().next().value.cells[0]; // choose one cell belonging to a rule
    for (let value of [0, 1]) {
      let [newRuleset, fixedCellValues] = this.setCellValue(firstCell, value);
      if (newRuleset != "invalid") {
        let subConfigurations = newRuleset.computeConfigurations();
        if (subConfigurations != "invalid") {
          configurations.push(new Configuration(subConfigurations, fixedCellValues));
        }
      }
    }
    return configurations.length == 0 ? "invalid" : configurations;
  }

  // return the new set of rules and all fixed cell values after solving all rules
  // return "invalid" if there is a contradiction
  setCellValue(cell: number, value: number, fixedCellValues: Map<number, number> = new Map()): [Ruleset, Map<number, number>] | ["invalid"] {
    let cellValuesToApply = new Map([[cell, value]]);
    let newRuleset: Ruleset | "invalid" = this;
    while (cellValuesToApply.size > 0) {
      [cell, value] = cellValuesToApply.entries().next().value;
      cellValuesToApply.delete(cell);
      fixedCellValues.set(cell, value);

      newRuleset = newRuleset.updateRules(cell, value);
      if (newRuleset == "invalid") {
        return ["invalid"];
      }
      let newFixedCellValues = newRuleset.getCellValuesFromSolvedRules();
      if (newFixedCellValues == "invalid") {
        return ["invalid"];
      }
      for ([cell, value] of newFixedCellValues) {
        if (fixedCellValues.has(cell) && fixedCellValues.get(cell) != value) {
          return ["invalid"];
        }
        cellValuesToApply.set(cell, value);
      }
    }
    return [newRuleset, fixedCellValues];
  }

  // return the resulting set of rules after fixing cell to value
  // return "invalid", if there is a contradiction to a rule
  updateRules(cell: number, value: number): Ruleset | "invalid" {
    let newRules: Set<Rule> = new Set();
    for (let rule of this.rules) {
      rule = rule.updateRule(cell, value);
      if (!rule.isValid()) {
        return "invalid";
      }
      if (!rule.isWaste()) {
        newRules.add(rule);
      }
    }
    return new Ruleset(newRules);
  }

  // return all cell values that are determined by a single rule
  // return "invalid", if there was a contradiction
  getCellValuesFromSolvedRules(): Map<number, number> | "invalid" {
    let fixedCellValues: Map<number, number> = new Map();
    for (let rule of this.rules) {
      if (rule.numberOfMines == 0) {
        for (let cell of rule.cells) {
          if (fixedCellValues.has(cell) && fixedCellValues.get(cell) != 0) {
            return "invalid";
          }
          fixedCellValues.set(cell, 0);
        }
      } else if (rule.numberOfMines == rule.cells.length) {
        for (let cell of rule.cells) {
          if (fixedCellValues.has(cell) && fixedCellValues.get(cell) != 1) {
            return "invalid";
          }
          fixedCellValues.set(cell, 1);
        }
      }
    }
    return fixedCellValues;
  }

  // iterate over all rules
  [Symbol.iterator]() {
    return this.rules.values();
  }
}
