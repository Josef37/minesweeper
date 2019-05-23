(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
  https://github.com/banksean wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.

  If you want to use this as a substitute for Math.random(), use the random()
  method like so:

  var m = new MersenneTwister();
  var randomNumber = m.random();

  You can also call the other genrand_{foo}() methods on the instance.

  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:

  var m = new MersenneTwister(123);

  and that will always produce the same random sequence.

  Sean McCullough (banksean@gmail.com)
*/

/*
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.

   Before using, initialize the state by using init_seed(seed)
   or init_by_array(init_key, key_length).

   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

     3. The names of its contributors may not be used to endorse or promote
        products derived from this software without specific prior written
        permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

var MersenneTwister = function(seed) {
	if (seed == undefined) {
		seed = new Date().getTime();
	}

	/* Period parameters */
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 0x9908b0df;   /* constant vector a */
	this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
	this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

	this.mt = new Array(this.N); /* the array for the state vector */
	this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */

	if (seed.constructor == Array) {
		this.init_by_array(seed, seed.length);
	}
	else {
		this.init_seed(seed);
	}
}

/* initializes mt[N] with a seed */
/* origin name init_genrand */
MersenneTwister.prototype.init_seed = function(s) {
	this.mt[0] = s >>> 0;
	for (this.mti=1; this.mti<this.N; this.mti++) {
		var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
		this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
		+ this.mti;
		/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
		/* In the previous versions, MSBs of the seed affect   */
		/* only MSBs of the array mt[].                        */
		/* 2002/01/09 modified by Makoto Matsumoto             */
		this.mt[this.mti] >>>= 0;
		/* for >32 bit machines */
	}
}

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
MersenneTwister.prototype.init_by_array = function(init_key, key_length) {
	var i, j, k;
	this.init_seed(19650218);
	i=1; j=0;
	k = (this.N>key_length ? this.N : key_length);
	for (; k; k--) {
		var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30)
		this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
		+ init_key[j] + j; /* non linear */
		this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
		i++; j++;
		if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
		if (j>=key_length) j=0;
	}
	for (k=this.N-1; k; k--) {
		var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
		this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
		- i; /* non linear */
		this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
		i++;
		if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	}

	this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
}

/* generates a random number on [0,0xffffffff]-interval */
/* origin name genrand_int32 */
MersenneTwister.prototype.random_int = function() {
	var y;
	var mag01 = new Array(0x0, this.MATRIX_A);
	/* mag01[x] = x * MATRIX_A  for x=0,1 */

	if (this.mti >= this.N) { /* generate N words at one time */
		var kk;

		if (this.mti == this.N+1)  /* if init_seed() has not been called, */
			this.init_seed(5489);  /* a default initial seed is used */

		for (kk=0;kk<this.N-this.M;kk++) {
			y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
			this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
		}
		for (;kk<this.N-1;kk++) {
			y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
			this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
		}
		y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
		this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];

		this.mti = 0;
	}

	y = this.mt[this.mti++];

	/* Tempering */
	y ^= (y >>> 11);
	y ^= (y << 7) & 0x9d2c5680;
	y ^= (y << 15) & 0xefc60000;
	y ^= (y >>> 18);

	return y >>> 0;
}

/* generates a random number on [0,0x7fffffff]-interval */
/* origin name genrand_int31 */
MersenneTwister.prototype.random_int31 = function() {
	return (this.random_int()>>>1);
}

/* generates a random number on [0,1]-real-interval */
/* origin name genrand_real1 */
MersenneTwister.prototype.random_incl = function() {
	return this.random_int()*(1.0/4294967295.0);
	/* divided by 2^32-1 */
}

/* generates a random number on [0,1)-real-interval */
MersenneTwister.prototype.random = function() {
	return this.random_int()*(1.0/4294967296.0);
	/* divided by 2^32 */
}

/* generates a random number on (0,1)-real-interval */
/* origin name genrand_real3 */
MersenneTwister.prototype.random_excl = function() {
	return (this.random_int() + 0.5)*(1.0/4294967296.0);
	/* divided by 2^32 */
}

/* generates a random number on [0,1) with 53-bit resolution*/
/* origin name genrand_res53 */
MersenneTwister.prototype.random_long = function() {
	var a=this.random_int()>>>5, b=this.random_int()>>>6;
	return(a*67108864.0+b)*(1.0/9007199254740992.0);
}

/* These real versions are due to Isaku Wada, 2002/01/09 added */

module.exports = MersenneTwister;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// representation of a single cell in the minesweeper grid
class Cell {
    constructor(hasMine) {
        this.hasMine = hasMine;
        this.isRevealed = false;
        this.isFlagged = false;
        this.numberOfAdjacentMines = -1;
        this.isHighlighted = false;
    }
    setNumberOfAdjacentMines(numberOfAdjacentMines) {
        this.numberOfAdjacentMines = numberOfAdjacentMines;
    }
    reveal() {
        this.isRevealed = true;
    }
    toggleFlag() {
        this.isFlagged = !this.isFlagged;
    }
    // draw square with border and mine, count or flag
    draw(context, x, y, size, isGameover = false) {
        // draw square with border
        if (this.isRevealed) {
            context.fillStyle = "#fff";
        }
        else if (this.isHighlighted) {
            context.fillStyle = "#ddf";
        }
        else {
            context.fillStyle = "#bbf";
        }
        context.fillRect(x, y, size, size);
        context.strokeStyle = "black";
        context.lineWidth = size / 30;
        context.strokeRect(x + context.lineWidth / 2, y + context.lineWidth / 2, size - context.lineWidth, size - context.lineWidth);
        // draw mine or count for revealed cell
        if (this.isRevealed || isGameover) {
            if (this.hasMine) {
                context.fillStyle = "black";
                context.beginPath();
                context.arc(x + size / 2, y + size / 2, size / 5, 0, 2 * Math.PI);
                context.fill();
            }
            else if (this.numberOfAdjacentMines > 0) {
                context.fillStyle = "black";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.font = `${size * 0.6}px sans-serif`;
                context.fillText(this.numberOfAdjacentMines.toString(), x + size * 0.5, y + size * 0.55, size);
            }
        }
        // draw flag for flagged cell
        if (!this.isRevealed && this.isFlagged) {
            context.fillStyle = "red";
            context.fillRect(x + size / 4, y + size / 4, size / 2, size / 2);
        }
    }
}
exports.Cell = Cell;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// representation of a valid mine configuration/distribution
// each instance stores a coherent part of a complete configuration and links to its successors
// by traversing the resulting tree structure, all distributions can be obtainend
class Configuration {
    constructor(subConfigurations,
    // cell values in this part of a complete configuration
    // cells may only occur once in a path in the configuration tree
    cellValues) {
        this.subConfigurations = subConfigurations;
        this.cellValues = cellValues;
    }
    // indicates that there is no further configuration
    isLast() {
        return this.subConfigurations.length == 0;
    }
    // iterate over subConfigurations
    [Symbol.iterator]() {
        return this.subConfigurations.values();
    }
    // perform callback on every possible complete configuration
    actOnAllConfigurations(callback, allCellValues = new Map()) {
        this.cellValues.forEach((value, key) => allCellValues.set(key, value));
        if (this.isLast()) {
            callback(allCellValues);
            return;
        }
        for (let subConfiguration of this.subConfigurations) {
            subConfiguration.actOnAllConfigurations(callback, allCellValues);
        }
    }
    // for all configurations return map from number of mines in configuration to mine probability and number of configurations
    mineProbabilitiesPerNumberOfMines() {
        let numberOfMinesToSummedValues = new Map();
        let combinationsPerNumberOfMines = new Map();
        // map from mines in configuration to summed values and accumulate number of combinations
        this.actOnAllConfigurations((cellValues) => {
            let minesInConfiguration = 0;
            cellValues.forEach(value => minesInConfiguration += value);
            if (!numberOfMinesToSummedValues.has(minesInConfiguration)) {
                numberOfMinesToSummedValues.set(minesInConfiguration, new Map());
                combinationsPerNumberOfMines.set(minesInConfiguration, 0);
            }
            let cellValuesSummed = numberOfMinesToSummedValues.get(minesInConfiguration);
            for (let [cell, value] of cellValues.entries()) {
                cellValuesSummed.set(cell, value + (cellValuesSummed.get(cell) || 0));
            }
            combinationsPerNumberOfMines.set(minesInConfiguration, 1 + combinationsPerNumberOfMines.get(minesInConfiguration));
        });
        // divide by number of combinations to get probability
        let numberOfMinesToProbabilityMap = numberOfMinesToSummedValues;
        for (let [numberOfMines, summedNumberOfMinesMap] of numberOfMinesToProbabilityMap) {
            let combinations = combinationsPerNumberOfMines.get(numberOfMines);
            summedNumberOfMinesMap.forEach((value, cell) => summedNumberOfMinesMap.set(cell, value / combinations));
        }
        return [numberOfMinesToProbabilityMap, combinationsPerNumberOfMines];
    }
}
exports.Configuration = Configuration;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const cell_1 = require("./cell");
var GameStatus;
(function (GameStatus) {
    GameStatus[GameStatus["Playing"] = 0] = "Playing";
    GameStatus["Won"] = "You've won!";
    GameStatus["Lost"] = "You've lost...";
})(GameStatus = exports.GameStatus || (exports.GameStatus = {}));
class Gameboard {
    constructor(width, height, totalNumberOfMines, isSaveFirstAction = true) {
        this.width = width;
        this.height = height;
        this.totalNumberOfMines = totalNumberOfMines;
        this.isSaveFirstAction = isSaveFirstAction;
        this.drawProbabilityMap = false;
        this.reset();
    }
    // set initial values
    reset() {
        this.gameStatus = GameStatus.Playing;
        this.highlightedX = -1;
        this.highlightedY = -1;
        this.chanceOfSurvial = 1;
        this.numberOfUnrevealedCells = this.width * this.height;
        this.createBoard();
    }
    // create cells with "totalNumberOfMines"
    createBoard() {
        let hasMine = Array(this.totalNumberOfMines).fill(true).concat(Array(this.width * this.height - this.totalNumberOfMines).fill(false));
        utils_1.Utils.shuffle(hasMine);
        this.createBoardFromArray(hasMine);
    }
    // create cells with "totalNumberOfMines"
    // makes sure no mine is at position (x,y)
    createBoardSave(x, y) {
        let hasMine = Array(this.totalNumberOfMines).fill(true).concat(Array(this.width * this.height - this.totalNumberOfMines - 1).fill(false));
        utils_1.Utils.shuffle(hasMine);
        hasMine.splice(utils_1.Utils.getIndex(x, y, this.width), 0, false);
        this.createBoardFromArray(hasMine);
    }
    // first: create cells from array indicating if a mine in there
    // second: calculate number of adjacent mines for each cell
    createBoardFromArray(hasMine) {
        this.board = [];
        for (let x = 0; x < this.width; x++) {
            this.board[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.board[x][y] = new cell_1.Cell(hasMine[utils_1.Utils.getIndex(x, y, this.width)]);
            }
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.board[x][y].hasMine) {
                    continue;
                }
                let numberOfAdjacentMines = 0;
                this.doForAllNeighbours(x, y, cell => numberOfAdjacentMines += Number(cell.hasMine));
                this.board[x][y].setNumberOfAdjacentMines(numberOfAdjacentMines);
            }
        }
    }
    // perform callback for all adjacent cells
    doForAllNeighbours(x, y, callback) {
        for (let dx of [-1, 0, 1]) {
            for (let dy of [-1, 0, 1]) {
                if (dx == 0 && dy == 0) { // ignore the cell itself
                    continue;
                }
                let neighbourX = x + dx, neighbourY = y + dy;
                if (!this.areValidCoordinates(neighbourX, neighbourY)) {
                    continue;
                }
                callback(this.board[neighbourX][neighbourY], neighbourX, neighbourY);
            }
        }
    }
    // action for a click on cell at (x, y)
    // return, if an action was performed
    doAction(x, y) {
        if (this.gameStatus != GameStatus.Playing || !this.areValidCoordinates(x, y) || this.board[x][y].isFlagged) {
            return false;
        }
        this.drawProbabilityMap = false;
        if (this.isInitialState() && this.isSaveFirstAction) {
            this.createBoardSave(x, y);
        }
        let cell = this.board[x][y];
        let newRevealedCells = new Set();
        let mineRevealed;
        if (cell.isRevealed) {
            mineRevealed = this.autoRevealCells(x, y, newRevealedCells);
        }
        else {
            mineRevealed = this.revealCell(x, y, newRevealedCells);
        }
        this.numberOfUnrevealedCells -= newRevealedCells.size;
        if (mineRevealed) {
            this.gameStatus = GameStatus.Lost;
        }
        else if (this.numberOfUnrevealedCells == this.totalNumberOfMines) {
            this.gameStatus = GameStatus.Won;
        }
        return newRevealedCells.size > 0;
    }
    // initiate mine revealing for all neighbours, when flagged cells match number of mines; save revealed cells
    // returns true, if mine was revealed
    autoRevealCells(x, y, revealedCells) {
        let cell = this.board[x][y];
        let numberOfFlaggedCells = 0;
        this.doForAllNeighbours(x, y, neighbour => numberOfFlaggedCells += Number(neighbour.isFlagged));
        if (numberOfFlaggedCells != cell.numberOfAdjacentMines) {
            return false;
        }
        let mineRevealed = false;
        this.doForAllNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
            if (!neighbour.isFlagged) {
                mineRevealed = mineRevealed || this.revealCell(neighbourX, neighbourY, revealedCells);
            }
        });
        return mineRevealed;
    }
    // reveal cells and propagate revealing, if there are no mines adjacent; save all revealed cells
    // returns true, if mine was revealed
    revealCell(x, y, revealedCells = new Set()) {
        let toVisit = [[x, y]];
        while (toVisit.length > 0) {
            let [x, y] = toVisit.shift();
            let cell = this.board[x][y];
            if (cell.isRevealed || revealedCells.has(cell)) {
                continue;
            }
            cell.reveal();
            revealedCells.add(cell);
            if (cell.hasMine) {
                return true;
            }
            if (cell.numberOfAdjacentMines == 0) {
                this.doForAllNeighbours(x, y, (_neighbour, neighbourX, neighbourY) => toVisit.push([neighbourX, neighbourY]));
            }
        }
        return false;
    }
    flagCell(x, y) {
        if (this.gameStatus != GameStatus.Playing || !this.areValidCoordinates(x, y)) {
            return;
        }
        this.board[x][y].toggleFlag();
    }
    // count the number of remaining mines considering flagged cells
    countRemainingMines() {
        let numberOfFlaggedCells = 0;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let cell = this.board[x][y];
                if (cell.isFlagged && !cell.isRevealed) {
                    numberOfFlaggedCells++;
                }
            }
        }
        return this.totalNumberOfMines - numberOfFlaggedCells;
    }
    // return if no cell is revealed
    isInitialState() {
        return this.numberOfUnrevealedCells == this.width * this.height;
    }
    // canvas position -> grid position
    transpose(canvasX, canvasY) {
        return [Math.floor(canvasX / this.cellSizeInCanvas), Math.floor(canvasY / this.cellSizeInCanvas)];
    }
    // return if coordinates are inside grid
    areValidCoordinates(x, y) {
        return 0 <= x && x < this.width && 0 <= y && y < this.height;
    }
    // set highlighted cell when not gameover or probability map is drawn
    highlight(context, x, y) {
        if (this.drawProbabilityMap || this.gameStatus != GameStatus.Playing
            || (x == this.highlightedX && y == this.highlightedY)) {
            return;
        }
        if (this.areValidCoordinates(this.highlightedX, this.highlightedY)) {
            this.board[this.highlightedX][this.highlightedY].isHighlighted = false;
            this.board[this.highlightedX][this.highlightedY]
                .draw(context, this.highlightedX * this.cellSizeInCanvas, this.highlightedY * this.cellSizeInCanvas, this.cellSizeInCanvas);
        }
        if (!this.areValidCoordinates(x, y)) {
            this.highlightedX = this.highlightedY = -1;
            return;
        }
        this.highlightedX = x;
        this.highlightedY = y;
        this.board[x][y].isHighlighted = true;
        this.board[x][y].draw(context, x * this.cellSizeInCanvas, y * this.cellSizeInCanvas, this.cellSizeInCanvas);
    }
    // draw the gameboard (optional with probability map)
    draw(context, width, height) {
        // unset highlight for probability map
        if (this.drawProbabilityMap && this.areValidCoordinates(this.highlightedX, this.highlightedY)) {
            this.board[this.highlightedX][this.highlightedY].isHighlighted = false;
            this.highlightedX = this.highlightedY = -1;
        }
        // draw grid
        this.cellSizeInCanvas = Math.floor(Math.min(width / this.width, (height / 1.1) / this.height));
        context.clearRect(0, 0, width, height);
        width = this.width * this.cellSizeInCanvas;
        height = this.height * this.cellSizeInCanvas;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.board[x][y].draw(context, x * this.cellSizeInCanvas, y * this.cellSizeInCanvas, this.cellSizeInCanvas, this.gameStatus != GameStatus.Playing);
            }
        }
        // mines remaining counter
        context.fillStyle = "black";
        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = `${height * 0.06}px sans-serif`;
        context.fillText("Mines remaining: " + this.countRemainingMines(), width, height + height * 0.03);
        // gameover overlay
        if (this.gameStatus != GameStatus.Playing) {
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.fillRect(0, 0, width, height);
            let centerX = width / 2;
            let centerY = height / 2;
            context.fillStyle = "black";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = `${height * 0.06}px sans-serif`;
            context.fillText(this.gameStatus, centerX, centerY - 0.05 * height);
            context.font = `${height * 0.03}px sans-serif`;
            context.fillText('(right-click to restart)', centerX, centerY + 0.025 * height);
        }
        if (this.drawProbabilityMap) {
            for (let [cell, mineProbability] of this.mineProbabilityMap) {
                let [x, y] = utils_1.Utils.getCoordinates(cell, this.width);
                context.fillStyle = `rgba(0,0,0,${mineProbability / 2})`;
                context.fillRect(x * this.cellSizeInCanvas, y * this.cellSizeInCanvas, this.cellSizeInCanvas, this.cellSizeInCanvas);
                context.fillStyle = "black";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.font = `${this.cellSizeInCanvas * 0.35}px sans-serif`;
                context.fillText(mineProbability.toFixed(2), (x + 0.5) * this.cellSizeInCanvas, (y + 0.53) * this.cellSizeInCanvas);
            }
        }
    }
}
exports.Gameboard = Gameboard;

},{"./cell":2,"./utils":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameboard_1 = require("./gameboard");
const solver_1 = require("./solver");
window.addEventListener('DOMContentLoaded', main);
function main() {
    let canvas = document.getElementById('gameboard');
    let context = canvas.getContext('2d');
    let width;
    let height;
    let padding = 50;
    // let gameboard = new Gameboard(5, 5, 5);
    // let gameboard = new Gameboard(8, 8, 10);
    // let gameboard = new Gameboard(16, 16, 40);
    let gameboard = new gameboard_1.Gameboard(30, 16, 99);
    // let gameboard = new Gameboard(100, 100, 100*100*0.2);
    let solver;
    resizeCanvas();
    canvas.addEventListener("click", onclick);
    canvas.addEventListener("contextmenu", onclick);
    canvas.addEventListener("mousemove", event => gameboard.highlight(context, ...gameboard.transpose(event.clientX - padding, event.clientY - padding)));
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("keypress", onkeypress);
    function onclick(event) {
        let canvasX = event.clientX - padding;
        let canvasY = event.clientY - padding;
        if (event.button == 0) { // Left mouse button
            gameboard.doAction(...gameboard.transpose(canvasX, canvasY));
        }
        else if (event.button == 2) { // Right mouse button
            if (gameboard.gameStatus != gameboard_1.GameStatus.Playing) {
                gameboard.reset();
            }
            else {
                gameboard.flagCell(...gameboard.transpose(canvasX, canvasY));
            }
        }
        drawGameboard();
        event.preventDefault();
    }
    function onkeypress(event) {
        if (gameboard.gameStatus != gameboard_1.GameStatus.Playing) {
            return;
        }
        console.time("solver");
        if (event.key == "s") {
            solver = new solver_1.Solver(gameboard);
            solver.solve();
            drawGameboard();
        }
        else if (event.key == "p") {
            solver = new solver_1.Solver(gameboard);
            drawProbabilityMap(solver.mineProbabilityMap);
        }
        else if (event.key == "t") {
            testSolver(100);
        }
        console.timeEnd("solver");
    }
    function testSolver(iterations) {
        let winCount = 0;
        for (let i = 1; i <= iterations; i++) {
            gameboard.reset();
            while (gameboard.gameStatus == gameboard_1.GameStatus.Playing) {
                solver = new solver_1.Solver(gameboard);
                solver.solve();
            }
            winCount += Number(gameboard.gameStatus == gameboard_1.GameStatus.Won);
            console.log(`${winCount} of ${i} won (${100 * winCount / i}%)`);
        }
        gameboard.reset();
    }
    function drawGameboard() {
        gameboard.draw(context, width - 2 * padding, height - 2 * padding);
    }
    function drawProbabilityMap(mineProbabilityMap) {
        gameboard.mineProbabilityMap = mineProbabilityMap;
        gameboard.drawProbabilityMap = true;
        drawGameboard();
    }
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        context.translate(padding, padding);
        drawGameboard();
    }
}

},{"./gameboard":4,"./solver":8}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        let updatedCells = this.cells.slice();
        updatedCells.splice(i, 1);
        return new Rule(this.numberOfMines - value, updatedCells);
    }
}
exports.Rule = Rule;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./configuration");
// representation of a set of connected rules
// TODO Optimize by only looking at affected cells and rules
class Ruleset {
    constructor(rules) {
        this.rules = rules;
    }
    // computes all possible configuration satisfying this set of rules
    computeConfigurations() {
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
                    configurations.push(new configuration_1.Configuration(subConfigurations, fixedCellValues));
                }
            }
        }
        return configurations.length == 0 ? "invalid" : configurations;
    }
    // return the new set of rules and all fixed cell values after solving all rules
    // return "invalid" if there is a contradiction
    setCellValue(cell, value, fixedCellValues = new Map()) {
        let cellValuesToApply = new Map([[cell, value]]);
        let newRuleset = this;
        while (cellValuesToApply.size > 0) {
            [cell, value] = cellValuesToApply.entries().next().value;
            cellValuesToApply.delete(cell);
            fixedCellValues.set(cell, value);
            newRuleset = this.applyRules(cell, value, newRuleset.rules);
            if (newRuleset == "invalid") {
                return ["invalid"];
            }
            let newFixedCellValues = newRuleset.getFixedCellValues();
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
    // return all cell values that are distinctly determined by this set of rules
    // return "invalid", if there was a contradiction
    getFixedCellValues() {
        let fixedCellValues = new Map();
        for (let rule of this.rules) {
            if (rule.numberOfMines == 0) {
                for (let cell of rule.cells) {
                    if (fixedCellValues.has(cell) && fixedCellValues.get(cell) != 0) {
                        return "invalid";
                    }
                    fixedCellValues.set(cell, 0);
                }
            }
            else if (rule.numberOfMines == rule.cells.length) {
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
exports.Ruleset = Ruleset;

},{"./configuration":3}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const ruleset_1 = require("./ruleset");
const rule_1 = require("./rule");
const configuration_1 = require("./configuration");
// solving one specific gameboard by calculating mine probabilities for every cell
// in the solving domain, cells are always identified by index, not coordinates
class Solver {
    constructor(gameboard, nextAction = { cellsToReveal: new Set([0]), cellsToFlag: new Set() }) {
        this.gameboard = gameboard;
        this.nextAction = nextAction;
        this.rulesets = [];
        this.unclearCellsWithoutRule = new Set();
        this.numberOfRemainingMines = gameboard.countRemainingMines();
        this.generateRulesetsFromGameboard();
        this.mineProbabilityMap = this.computeProbabilityMap();
        this.cellsByPriority = // corner cells
            [0, gameboard.width - 1, gameboard.width * (gameboard.height - 1), gameboard.width * gameboard.height - 1];
    }
    // collect rules into distinct sets, so these sets do not share any cell
    // if rules are connected through their cells, a ruleset is a connected component in that graph
    generateRulesetsFromGameboard() {
        let rules = this.rulesFromGameboard();
        if (rules.length == 0) {
            return;
        }
        let undiscoveredCells = new Set(rules.flatMap(rule => rule.cells));
        // Until each cell was discovered, collect the affected rules connected to that cell
        while (undiscoveredCells.size > 0) {
            let undiscoveredCell = undiscoveredCells.values().next().value;
            undiscoveredCells.delete(undiscoveredCell);
            let affectedRules = new Set();
            let cellsToCheckForChange = [undiscoveredCell];
            while (cellsToCheckForChange.length > 0) {
                let cellToCheck = cellsToCheckForChange.shift();
                for (let i = rules.length - 1; i >= 0; i--) { // loop backwards because of element removal
                    let rule = rules[i];
                    if (rule.cells.includes(cellToCheck)) { // rule is connected
                        rules.splice(rules.indexOf(rule), 1); // rules are only in one ruleset
                        affectedRules.add(rule);
                        let newUndiscoveredCells = rule.cells.filter((cell) => undiscoveredCells.has(cell));
                        newUndiscoveredCells.forEach((newCell) => undiscoveredCells.delete(newCell));
                        cellsToCheckForChange = cellsToCheckForChange.concat(newUndiscoveredCells);
                    }
                }
            }
            this.rulesets.push(new ruleset_1.Ruleset(affectedRules));
        }
    }
    // return all visible rules as an array
    rulesFromGameboard() {
        let rules = [];
        this.unclearCellsWithoutRule = this.getUnclearCells();
        for (let x = 0; x < this.gameboard.width; x++) {
            for (let y = 0; y < this.gameboard.height; y++) {
                let cell = this.gameboard.board[x][y];
                if (!cell.isRevealed) {
                    continue;
                }
                let numberOfMinesInRule = cell.numberOfAdjacentMines;
                let cellsInRule = [];
                this.gameboard.doForAllNeighbours(x, y, (neighbour, neighbourX, neighbourY) => {
                    if (!neighbour.isRevealed && neighbour.isFlagged) {
                        numberOfMinesInRule--;
                    }
                    else if (!neighbour.isRevealed && !neighbour.isFlagged) {
                        let neighbourIndex = utils_1.Utils.getIndex(neighbourX, neighbourY, this.gameboard.width);
                        cellsInRule.push(neighbourIndex);
                        this.unclearCellsWithoutRule.delete(neighbourIndex);
                    }
                });
                if (cellsInRule.length > 0) {
                    rules.push(new rule_1.Rule(numberOfMinesInRule, cellsInRule));
                }
            }
        }
        return rules;
    }
    // return a set of all cells that are not revealed or flagged
    getUnclearCells() {
        let unclearCells = new Set();
        for (let x = 0; x < this.gameboard.width; x++) {
            for (let y = 0; y < this.gameboard.height; y++) {
                let cell = this.gameboard.board[x][y];
                if (!cell.isRevealed && !cell.isFlagged) {
                    unclearCells.add(utils_1.Utils.getIndex(x, y, this.gameboard.width));
                }
            }
        }
        return unclearCells;
    }
    // compute and execute action
    solve() {
        this.computeAction();
        this.doAction();
    }
    // compute the next action to take
    computeAction() {
        if (this.gameboard.isInitialState()) {
            return;
        }
        this.nextAction = this.decideAction(this.mineProbabilityMap);
    }
    // reveal and flag cells given by next action
    doAction() {
        for (let cell of this.nextAction.cellsToReveal) {
            this.gameboard.doAction(...utils_1.Utils.getCoordinates(cell, this.gameboard.width));
        }
        for (let cell of this.nextAction.cellsToFlag) {
            this.gameboard.flagCell(...utils_1.Utils.getCoordinates(cell, this.gameboard.width));
        }
    }
    // compute map: cell -> probability it contains a mine
    computeProbabilityMap() {
        let mineProbabilityMap = new Map();
        // for each ruleset: map from number of mines in the configurations to the probability of a cell containing a mine (while configuration has given number of mines)
        let numberOfMinesToProbabilityMapByRulesets = [];
        // for each ruleset: map from number of mines to the number of valid configurations containing that number of mines
        let combinationsPerNumberOfMinesByRulesets = [];
        for (let ruleset of this.rulesets) {
            // ruleset.computeConfigurations() doesn't return "invalid", because there is always at least one valid configuration
            let configurations = new configuration_1.Configuration(ruleset.computeConfigurations(), new Map());
            let [numberOfMinesToProbabilityMaps, combinationsPerNumberOfMines] = configurations.mineProbabilitiesPerNumberOfMines();
            numberOfMinesToProbabilityMapByRulesets.push(numberOfMinesToProbabilityMaps);
            combinationsPerNumberOfMinesByRulesets.push(combinationsPerNumberOfMines);
        }
        // compute lower bound k for reducing binomial coefficient
        let minimalMinesNotInConfiguration = this.gameboard.totalNumberOfMines;
        if (combinationsPerNumberOfMinesByRulesets.length > 0) {
            minimalMinesNotInConfiguration = Math.max(0, this.numberOfRemainingMines - combinationsPerNumberOfMinesByRulesets.map(combinations => Math.max(...combinations.keys())).reduce((acc, val) => acc + val));
        }
        let totalCombinations = this.generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, new Map(), mineProbabilityMap, minimalMinesNotInConfiguration);
        mineProbabilityMap.forEach((value, cell) => mineProbabilityMap.set(cell, value / totalCombinations));
        return mineProbabilityMap;
    }
    // piece together all probability maps and weight by number of possible configurations
    // return the total number of valid configurations
    generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, currentCellValues, summedCellValues, minimalMinesNotInConfiguration, rulesetIndex = 0, currentCombinations = 1, totalCombinations = 0, minesInConfiguration = 0) {
        if (rulesetIndex == numberOfMinesToProbabilityMapByRulesets.length) { // complete configuration generated
            let minesNotInConfiguration = this.numberOfRemainingMines - minesInConfiguration;
            currentCombinations *= utils_1.Utils.reducedBinomial(this.unclearCellsWithoutRule.size, minesNotInConfiguration, minimalMinesNotInConfiguration); // distribute remaining mines equally to "unruled" cells
            currentCellValues.forEach((value, cell) => summedCellValues.set(cell, value * currentCombinations + (summedCellValues.get(cell) || 0))); // weight by number of configurations
            this.unclearCellsWithoutRule.forEach(cell => summedCellValues.set(cell, minesNotInConfiguration / this.unclearCellsWithoutRule.size * currentCombinations + (summedCellValues.get(cell) || 0)));
            return totalCombinations + currentCombinations;
        }
        for (let [mineCount, mineProbabilityMap] of numberOfMinesToProbabilityMapByRulesets[rulesetIndex]) {
            mineProbabilityMap.forEach((value, cell) => currentCellValues.set(cell, value));
            let combinations = combinationsPerNumberOfMinesByRulesets[rulesetIndex].get(mineCount);
            totalCombinations = this.generateProbabilityMap(numberOfMinesToProbabilityMapByRulesets, combinationsPerNumberOfMinesByRulesets, currentCellValues, summedCellValues, minimalMinesNotInConfiguration, rulesetIndex + 1, currentCombinations * combinations, totalCombinations, minesInConfiguration + mineCount);
        }
        return totalCombinations;
    }
    // TODO When unsafe, consider opening corners first (or any other rule)
    // Given the probability of cell containing mines, compute action to take next
    decideAction(mineProbabilityMap) {
        let action = { cellsToReveal: new Set(), cellsToFlag: new Set() };
        let leastRisk = Math.min(...mineProbabilityMap.values());
        if (Math.abs(leastRisk) > Number.EPSILON) { // open only one cell with least mine probability
            console.log("Now guessing with chance of failure of", leastRisk);
            console.log("Survial chance up to this point", this.gameboard.chanceOfSurvial *= (1 - leastRisk));
            let leastRiskCells = new Set();
            for (let [cell, value] of mineProbabilityMap) {
                if (Math.abs(value - leastRisk) < Number.EPSILON) {
                    leastRiskCells.add(cell);
                }
            }
            for (let cell of this.cellsByPriority) { // select priority cells
                if (leastRiskCells.has(cell)) {
                    action.cellsToReveal.add(cell);
                    return action;
                }
            }
            action.cellsToReveal.add(leastRiskCells.values().next().value); // select anything else
            return action;
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
exports.Solver = Solver;

},{"./configuration":3,"./rule":6,"./ruleset":7,"./utils":9}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MersenneTwister = require("mersenne-twister");
// handy utilities
class Utils {
    // modern Fisher–Yates shuffle (in-place)
    static shuffle(array, seed) {
        let generator = seed == undefined ? new MersenneTwister() : new MersenneTwister(seed);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(generator.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    // convert coordinates to x-first index (x-first = x is counted up first)
    static getIndex(x, y, gridWidth) {
        return x + y * gridWidth;
    }
    // convert x-first index to coordinates (x-first = x is counted up first)
    static getCoordinates(index, gridWidth) {
        let x = index % gridWidth, y = Math.floor(index / gridWidth);
        return [x, y];
    }
    // binomial coefficient "n choose k"
    static choose(n, k) {
        if (k < 0)
            return 0;
        if (k === 0)
            return 1;
        return n / k * Utils.choose(n - 1, k - 1);
    }
    // calculate choose(n,k) / choose(n, minimalK)
    static reducedBinomial(n, k, minimalK) {
        if (k < 0)
            return 0;
        let result = 1;
        for (let i = 0; i < k - minimalK; i++) {
            result *= (n - minimalK - i) / (k - i);
        }
        return result;
    }
}
exports.Utils = Utils;
// map from keys to multiple values
class Multimap {
    constructor() {
        this.map = new Map();
    }
    set(key, value) {
        if (this.map.has(key)) {
            this.map.get(key).add(value);
        }
        else {
            this.map.set(key, new Set([value]));
        }
    }
    get(key) {
        return this.map.get(key);
    }
    delete(key, value = null) {
        if (!this.map.has(key)) {
            return false;
        }
        if (typeof value == null) {
            return this.map.delete(key);
        }
        else {
            let values = this.map.get(key);
            if (values.size == 1 && values.has(value)) {
                return this.map.delete(key);
            }
            else {
                return values.delete(value);
            }
        }
    }
    keys() {
        return this.map.keys();
    }
}
exports.Multimap = Multimap;

},{"mersenne-twister":1}]},{},[5]);
