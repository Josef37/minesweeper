window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas: HTMLCanvasElement = (<HTMLCanvasElement>document.getElementById('gameboard')),
    context: CanvasRenderingContext2D = canvas.getContext('2d'),
    width: number,
    height: number,
    padding: number = 50;

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
  document.addEventListener("keypress", (event) => {
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
      drawProbabilityMap(solver.computeProbabilityMap());
    }
    console.timeEnd("solver");
  });

  function onclick(event: MouseEvent) {
    let canvasX = event.clientX - padding,
      canvasY = event.clientY - padding;
    if (event.button == 0) {
      gameboard.doAction(...gameboard.transpose(canvasX, canvasY));
    } else if (event.button == 2) {
      if (gameboard.gameStatus != GameStatus.Playing) {
        gameboard.reset();
      } else {
        gameboard.flagCell(...gameboard.transpose(canvasX, canvasY));
      }
    }
    drawGameboard();
    event.preventDefault();
  }

  function drawGameboard() {
    gameboard.draw(context, width - 2 * padding, height - 2 * padding);
  }

  function drawProbabilityMap(mineProbabilityMap: Map<number, number>) {
    gameboard.mineProbabilityMap = mineProbabilityMap;
    gameboard.drawProbabilityMap = true;
    gameboard.draw(context, width - 2 * padding, height - 2 * padding);
  }

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    context.translate(padding, padding);
    drawGameboard();
  }
}
