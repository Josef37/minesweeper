// respresentation of a single rule specifying the number of mines contained in the given cells
class Rule {
    constructor(numberOfMines, cells) {
        this.numberOfMines = numberOfMines;
        this.cells = cells;
    }
    // indicates that the rule can be satisfied
    isValid() {
        return 0 <= this.numberOfMines && this.numberOfMines <= this.cells.length;
    }
    // indicates that rule can be disposed
    isWaste() {
        return this.cells.length == 0;
    }
    // return modified rule, if setting cell to value impacts rule
    updateRule(cell, value) {
        let i = this.cells.indexOf(cell);
        if (i == -1) {
            return this;
        }
        let newCells = this.cells.slice();
        newCells.splice(i, 1);
        return new Rule(this.numberOfMines - value, newCells);
    }
}
