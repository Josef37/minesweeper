// representation of a valid mine configuration/distribution
// each instance stores a coherent part of a complete configuration and links to its successors
// by traversing the resulting tree structure, all distributions can be obtainend
class Configuration {
  constructor(public subConfigurations: Configuration[],
    // cell values in this part of a complete configuration
    // cells may only occur once in a path in the configuration tree
    public cellValues: Map<number, number>) {}

  // indicates that there is no further configuration
  isLast() {
    return this.subConfigurations.length == 0;
  }

  // iterate over subConfigurations
  [Symbol.iterator]() {
    return this.subConfigurations.values();
  }

  // perform callback on every possible complete configuration
  actOnAllConfigurations(callback: (allCellValues: Map<number, number>) => any, allCellValues: Map<number, number> = new Map()) {
    this.cellValues.forEach((value, key) => allCellValues.set(key, value));
    if(this.isLast()) {
      callback(allCellValues);
      return;
    }
    for(let subConfiguration of this.subConfigurations) {
      subConfiguration.actOnAllConfigurations(callback, allCellValues);
    }
  }
}
