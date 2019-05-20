class Solver {
    constructor(gameboard) {
        this.gameboard = gameboard;
        this.rulesets = [];
        this.cellsWithoutRule = new Set();
        this.remainingMines = gameboard.countRemainingMines();
        this.rulesetsFromGameboard();
        this.action = { cellsToReveal: new Set([0]), cellsToFlag: new Set() };
    }
    rulesetsFromGameboard() {
        let rules = this.rulesFromGameboard();
        if (rules.length == 0) {
            return [];
        }
        let undiscoveredCells = new Set();
        for (let rule of rules) {
            rule.cells.forEach((cell) => undiscoveredCells.add(cell));
        }
        // Until each cell was discovered, collect the affected rules connected to that cell
        while (undiscoveredCells.size > 0) {
            let newCell = undiscoveredCells.values().next().value;
            undiscoveredCells.delete(newCell);
            let affectedRules = new Set(), cellsToCheck = [newCell];
            while (cellsToCheck.length > 0) {
                let cellToCheck = cellsToCheck.shift();
                for (let i = rules.length - 1; i >= 0; i--) { // loop backwards because of element removal
                    let rule = rules[i];
                    if (rule.cells.includes(cellToCheck)) { // rule is affeced
                        rules.splice(rules.indexOf(rule), 1); // rules are distinct in one ruleset
                        affectedRules.add(rule);
                        let newCells = rule.cells.filter((cell) => undiscoveredCells.has(cell));
                        newCells.forEach((newCell) => undiscoveredCells.delete(newCell));
                        cellsToCheck = cellsToCheck.concat(newCells);
                    }
                }
            }
            this.rulesets.push(new Ruleset(affectedRules));
        }
    }
    rulesFromGameboard() {
        let rules = [];
        this.cellsWithoutRule = this.getUnsafeCells();
        for (let x = 0; x < this.gameboard.width; x++) {
            for (let y = 0; y < this.gameboard.height; y++) {
                let cell = this.gameboard.board[x][y];
                if (!cell.isRevealed) {
                    continue;
                }
                let mineCount = cell.adjacentMinesCount, cells = [];
                this.gameboard.iterateNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
                    if (!neighbour.isRevealed) {
                        if (neighbour.isFlagged) {
                            mineCount--;
                        }
                        else {
                            let neighbourIndex = Utils.getIndex(neighbourX, neighbourY, this.gameboard.width);
                            cells.push(neighbourIndex);
                            this.cellsWithoutRule.delete(neighbourIndex);
                        }
                    }
                });
                if (cells.length > 0) {
                    rules.push(new Rule(mineCount, cells));
                }
            }
        }
        return rules;
    }
    getUnsafeCells() {
        let unsafeCells = new Set();
        for (let x = 0; x < this.gameboard.width; x++) {
            for (let y = 0; y < this.gameboard.height; y++) {
                let cell = this.gameboard.board[x][y];
                if (!cell.isRevealed && !cell.isFlagged) {
                    unsafeCells.add(Utils.getIndex(x, y, this.gameboard.width));
                }
            }
        }
        return unsafeCells;
    }
    solve() {
        this.computeAction();
        this.doAction();
    }
    computeAction() {
        if (this.gameboard.isInitialState()) {
            return;
        }
        this.action = this.decideAction(this.computeProbabilityMap());
    }
    doAction() {
        for (let cell of this.action.cellsToReveal) {
            this.gameboard.doAction(...Utils.getCoordinates(cell, this.gameboard.width));
        }
        for (let cell of this.action.cellsToFlag) {
            this.gameboard.flagCell(...Utils.getCoordinates(cell, this.gameboard.width));
        }
    }
    computeProbabilityMap() {
        let mineProbabilityMap = new Map();
        let mineCountToProbabilityMaps = [], combinationsPerMineCounts = [];
        for (let ruleset of this.rulesets) {
            // there is always at least one valid configuration, when there is any rule 
            let configurations = new Configuration(ruleset.calculateCellValues(), new Map());
            let mineCountToProbabilityMap = new Map();
            let combinationsPerMineCount = new Map();
            this.mineProbabilitiesInConfigurationPerMineCount(configurations, new Map(), mineCountToProbabilityMap, combinationsPerMineCount);
            for (let [mineCount, mineCountMap] of mineCountToProbabilityMap) {
                let combinations = combinationsPerMineCount.get(mineCount);
                mineCountMap.forEach((value, cell) => mineCountMap.set(cell, value / combinations));
            }
            mineCountToProbabilityMaps.push(mineCountToProbabilityMap);
            combinationsPerMineCounts.push(combinationsPerMineCount);
        }
        let totalCombinations = this.generateProbabilityMap(mineCountToProbabilityMaps, combinationsPerMineCounts, new Map(), mineProbabilityMap);
        mineProbabilityMap.forEach((value, cell) => mineProbabilityMap.set(cell, value / totalCombinations));
        let sum = 0;
        mineProbabilityMap.forEach(value => sum += value);
        return mineProbabilityMap;
    }
    generateProbabilityMap(mineCountToProbabilityMaps, combinationsPerMineCounts, cellValues, summedCellValues, rulesetIndex = 0, currentCombinations = 1, totalCombinations = 0, minesInConfiguration = 0) {
        if (rulesetIndex == mineCountToProbabilityMaps.length) {
            let minesNotInConfiguration = this.remainingMines - minesInConfiguration;
            currentCombinations *= Utils.choose(this.cellsWithoutRule.size, minesNotInConfiguration); // TODO what to do about binomials getting huge?
            cellValues.forEach((value, cell) => summedCellValues.set(cell, value * currentCombinations + (summedCellValues.get(cell) || 0)));
            this.cellsWithoutRule.forEach(cell => summedCellValues.set(cell, currentCombinations * minesNotInConfiguration / this.cellsWithoutRule.size + (summedCellValues.get(cell) || 0)));
            return totalCombinations + currentCombinations;
        }
        let mineCountToProbabilityMap = mineCountToProbabilityMaps[rulesetIndex];
        let combinationsPerMineCount = combinationsPerMineCounts[rulesetIndex];
        for (let [mineCount, mineProbabilityMap] of mineCountToProbabilityMap) {
            mineProbabilityMap.forEach((value, cell) => cellValues.set(cell, value));
            let combinations = combinationsPerMineCount.get(mineCount);
            totalCombinations = this.generateProbabilityMap(mineCountToProbabilityMaps, combinationsPerMineCounts, cellValues, summedCellValues, rulesetIndex + 1, currentCombinations * combinations, totalCombinations, minesInConfiguration + mineCount);
        }
        return totalCombinations;
    }
    mineProbabilitiesInConfigurationPerMineCount(configurations, cellValues, mineCountToProbabilityMap, combinationsPerMineCount) {
        for (let [cell, value] of configurations.cellValues.entries()) {
            cellValues.set(cell, value);
        }
        if (configurations.isLast()) {
            let minesInConfiguration = 0;
            cellValues.forEach(value => minesInConfiguration += value);
            if (!mineCountToProbabilityMap.has(minesInConfiguration)) {
                mineCountToProbabilityMap.set(minesInConfiguration, new Map());
                combinationsPerMineCount.set(minesInConfiguration, 0);
            }
            let cellValuesSummed = mineCountToProbabilityMap.get(minesInConfiguration);
            for (let [cell, value] of cellValues.entries()) {
                cellValuesSummed.set(cell, value + (cellValuesSummed.get(cell) || 0));
            }
            combinationsPerMineCount.set(minesInConfiguration, 1 + combinationsPerMineCount.get(minesInConfiguration));
        }
        for (let configuration of configurations) {
            this.mineProbabilitiesInConfigurationPerMineCount(configuration, cellValues, mineCountToProbabilityMap, combinationsPerMineCount);
        }
    }
    decideAction(mineProbabilityMap) {
        let action = { cellsToReveal: new Set(), cellsToFlag: new Set() };
        let leastRisk = Math.min(...mineProbabilityMap.values());
        if (leastRisk > 0) {
            console.log("Now guessing with chance of failure of", leastRisk);
            this.gameboard.chanceOfSurvial *= (1 - leastRisk);
            console.log("Survial chance up to this point", this.gameboard.chanceOfSurvial);
            for (let [cell, value] of mineProbabilityMap) {
                if (value == leastRisk) {
                    action.cellsToReveal.add(cell);
                    return action;
                }
            }
        }
        for (let [cell, value] of mineProbabilityMap) {
            if (Math.abs(value - 0) < Number.EPSILON) {
                action.cellsToReveal.add(cell);
            }
            else if (Math.abs(value - 1) < Number.EPSILON) {
                action.cellsToFlag.add(cell);
            }
        }
        return action;
    }
}
