window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas: HTMLCanvasElement = (<HTMLCanvasElement>document.getElementById('gameboard'));
  let context: CanvasRenderingContext2D = canvas.getContext('2d');
  let width: number;
  let height: number;
  let padding: number = 50;

  // let gameboard = new Gameboard(5, 5, 5);
  // let gameboard = new Gameboard(8, 8, 10);
  // let gameboard = new Gameboard(16, 16, 40);
  let gameboard = new Gameboard(30, 16, 99);
  // let gameboard = new Gameboard(100, 100, 1);
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
    }
    console.timeEnd("solver");
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
