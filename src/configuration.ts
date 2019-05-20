class Configuration {
  subConfigurations: Configuration[];
  cellValues: Map<number, number>;

  constructor(subConfigurations: Configuration[], cellValues: Map<number, number>) {
    this.subConfigurations = subConfigurations;
    this.cellValues = cellValues;
  }

  isLast() {
    return this.subConfigurations.length == 0;
  }

  [Symbol.iterator]() {
    return this.subConfigurations.values();
  }
}
