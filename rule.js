class Rule {
  constructor(mineCount, cells) {
    this.mineCount = mineCount;
    this.cells = cells;
  }

  isValid() {
    return 0 <= this.mineCount && this.mineCount <= this.cells.length;
  }

  updateRule(cell, value) {
    let i = this.cells.indexOf(cell);
    if(i >= 0) {
      this.mineCount -= value;
      this.cells.splice(i, 1);
    }
    return this.isValid();
  }

  copy() {
    return new Rule(this.mineCount, this.cells.slice());
  }
}
