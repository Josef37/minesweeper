# Minesweeper
## TypeScript minesweeper with solver

This project is a simple [minesweeper](https://en.wikipedia.org/wiki/Minesweeper_(video_game)) game with an automatic solver.

The solver generates all valid mine configurations and then adds them up to get a probability distribution.

## Settings and controls (before UI)
* In main.js change `let gameboard = new Gameboard(width, height, totalNumberOfMines, isSaveFirstAction=true)`.
* Left-click on an unrevealed cell to reveal it.
* Right-click on an unrevealed cell to flag it (and block revealing).
* Left-click on a revealed cell, with mine count and number of flags matching, to reveal all adjacent cells.
* Press `P` to display the probability distribution of mines.
* Press `S` to automatically do the next action the solver suggests.

