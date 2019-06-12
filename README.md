# Minesweeper
## TypeScript minesweeper with solver

This project is a simple [minesweeper](https://en.wikipedia.org/wiki/Minesweeper_(video_game)) game with an automatic solver, which computes a probability distribution of mines.

## How to run
Open `deploy/index.html` in your preferred browser

## How to setup this project
1. Good old `npm install`
1. Use Browserify to build:
`browserify src/main.ts -p [ tsify ] -o deploy/bundle.js`

## Settings and controls (before UI)
* In `bundle.js` change `let gameboard = new gameboard_1.Gameboard(width, height, totalNumberOfMines, isSaveFirstAction=true)`.
* Left-click on an unrevealed cell to reveal it.
* Right-click on an unrevealed cell to flag it (and block revealing).
* Left-click on a revealed cell, with mine count and number of flags matching, to reveal all adjacent cells.
* Press `P` to display the probability distribution of mines.
* Press `S` to automatically do the next action the solver suggests.
* Press `T` to test 100 rounds of the solver (result in console)

## Performance
At commit 9d06109 (prioritizing corner cells)

| Wins | Rounds |  Rate |
| ---: |   ---: |  ---: |
| 389  |   1000 | 38.9% |
| 385  |   1000 | 38.5% |
| 376  |   1000 | 37.6% |
| 401  |   1000 | 40.1% |
| 400  |   1000 |   40% |
| 3823 |  10000 | 38.2% |
| 3909 |  10000 | 39.1% |
