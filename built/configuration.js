class Configuration {
    constructor(subConfigurations, cellValues) {
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
