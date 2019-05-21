// respresentation of a single rule specifying the number of mines contained in the given cells
class Rule {
  constructor(public numberOfMines: number,
    public cells: number[]) {}

  // indicates that the rule can be satisfied
  isValid(): boolean {
    return 0 <= this.numberOfMines && this.numberOfMines <= this.cells.length;
  }

  // indicates that rule can be disposed
  isWaste(): boolean {
    return this.cells.length == 0;
  }

  // return modified rule, if setting cell to value impacts rule
  updateRule(cell: number, value: number): Rule {
    let i = this.cells.indexOf(cell);
    if (i == -1) {
      return this;
    }
    let updatedCells: number[] = this.cells.slice();
    updatedCells.splice(i, 1);
    return new Rule(this.numberOfMines - value, updatedCells);
  }
}
