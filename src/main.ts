import { Gameboard, GameStatus } from "./gameboard";
import { Solver } from "./solver";

window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas: HTMLCanvasElement = (<HTMLCanvasElement>document.getElementById('gameboard'));
  let context: CanvasRenderingContext2D = canvas.getContext('2d');
  let width: number;
  let height: number;
  let padding: number = 50;

  let gameboard = new Gameboard(5, 5, 5, false, 0);
  // let gameboard = new Gameboard(8, 8, 10);
  // let gameboard = new Gameboard(16, 16, 40);
  // let gameboard = new Gameboard(30, 16, 99);
  // let gameboard = new Gameboard(100, 100, 100*100*0.2);
  let solver: Solver;
  resizeCanvas();

  canvas.addEventListener("click", onclick);
  canvas.addEventListener("contextmenu", onclick);
  canvas.addEventListener("mousemove", event =>
    gameboard.highlight(context, ...gameboard.transpose(event.clientX - padding, event.clientY - padding)));
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("keypress", onkeypress);

  function onclick(event: MouseEvent) {
    let canvasX = event.clientX - padding;
    let canvasY = event.clientY - padding;
    if (event.button == 0) { // Left mouse button
      gameboard.doAction(...gameboard.transpose(canvasX, canvasY));
    } else if (event.button == 2) { // Right mouse button
      if (gameboard.gameStatus != GameStatus.Playing) {
        gameboard.reset();
      } else {
        gameboard.flagCell(...gameboard.transpose(canvasX, canvasY));
      }
    }
    drawGameboard();
    event.preventDefault();
  }

  function onkeypress(event: KeyboardEvent) {
    if (gameboard.gameStatus != GameStatus.Playing) {
      return;
    }
    console.time("solver");
    if (event.key == "s") {
      solver = new Solver(gameboard);
      solver.solve();
      drawGameboard();
    } else if (event.key == "p") {
      solver = new Solver(gameboard);
      drawProbabilityMap(solver.mineProbabilityMap);
    } else if (event.key == "t") {
      testSolver(100);
    }
    console.timeEnd("solver");
  }

  function testSolver(iterations: number) {
    let winCount = 0;
    for (let i = 1; i <= iterations; i++) {
      gameboard.reset();
      while (gameboard.gameStatus == GameStatus.Playing) {
        solver = new Solver(gameboard);
        solver.solve();
      }
      winCount += Number(gameboard.gameStatus == GameStatus.Won);
      console.log(`${winCount} of ${i} won (${100*winCount/i}%)`);
    }
    gameboard.reset();
}

  function drawGameboard() {
    gameboard.draw(context, width - 2 * padding, height - 2 * padding);
  }

  function drawProbabilityMap(mineProbabilityMap: Map<number, number>) {
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
