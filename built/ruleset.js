class Ruleset {
    constructor(rules) {
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
                let subConfigurations = newRuleset.calculateCellValues();
                if (subConfigurations != "invalid") {
                    configurations.push(new Configuration(subConfigurations, this.cellValues));
                }
            }
        }
        return configurations.length == 0 ? "invalid" : configurations;
    }
    // return the new set of rules after solving all rules, return "invalid" if there is a contradiction
    setCellValue(cell, value) {
        let cellValuesToApply = new Map([[cell, value]]), newRuleset = this;
        while (cellValuesToApply.size > 0) {
            [cell, value] = cellValuesToApply.entries().next().value;
            cellValuesToApply.delete(cell);
            this.cellValues.set(cell, value);
            newRuleset = this.applyRules(cell, value, newRuleset.rules);
            if (newRuleset == "invalid") {
                return "invalid";
            }
            let newSolvedCellValues = newRuleset.getSolvedCellValues();
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
    applyRules(cell, value, rules) {
        let newRules = new Set();
        for (let rule of rules) {
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
    // return "invalid", if there was a contradiction
    getSolvedCellValues() {
        let cellValues = new Map();
        for (let rule of this.rules) {
            if (rule.numberOfMines == 0) {
                for (let cell of rule.cells) {
                    if (cellValues.has(cell) && cellValues.get(cell) != 0) {
                        return "invalid";
                    }
                    cellValues.set(cell, 0);
                }
            }
            else if (rule.numberOfMines == rule.cells.length) {
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
    [Symbol.iterator]() {
        return this.rules.values();
    }
}
