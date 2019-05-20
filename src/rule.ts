class Rule {
  mineCount: number;
  cells: number[];

  constructor(mineCount: number, cells: number[]) {
    this.mineCount = mineCount;
    this.cells = cells;
  }

  isValid() {
    return 0 <= this.mineCount && this.mineCount <= this.cells.length;
  }

  updateRule(cell: number, value: number) {
    let i = this.cells.indexOf(cell);
    if (i >= 0) {
      this.mineCount -= value;
      this.cells.splice(i, 1);
    }
    return this.isValid();
  }

  copy() {
    return new Rule(this.mineCount, this.cells.slice());
  }
}
