window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas = document.getElementById('gameboard'),
      context = canvas.getContext('2d'),
      width,
      height,
      padding = 50;

  let gameboard = new Gameboard(5, 5, 4);
  // let gameboard = new Gameboard(8, 8, 10);
  // let gameboard = new Gameboard(16, 16, 40);
  // let gameboard = new Gameboard(30, 16, 99);
  resizeCanvas();

  canvas.addEventListener("click", onclick);
  canvas.addEventListener("contextmenu", onclick);
  canvas.addEventListener("mousemove",
    event => gameboard.highlight(context, event.clientX - padding, event.clientY - padding));
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("keypress", (event) => {
    if(event.key === "s" && !gameboard.gameover) {
      let solver = new Solver(gameboard);
      solver.solve();
      drawGameboard();
    }
  });

  function onclick(event) {
    let x = event.clientX - padding,
        y = event.clientY - padding;
    if(event.button == 0) {
      gameboard.doAction(...gameboard.getCoordinates(x, y));
    } else if(event.button == 2) {
      if(gameboard.gameover) {
        gameboard.reset();
      } else {
        gameboard.markCell(...gameboard.getCoordinates(x, y));
      }
    }
    drawGameboard();
    event.preventDefault();
  }

  function drawGameboard() {
    gameboard.draw(context, width-2*padding, height-2*padding);
  }

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    context.translate(padding, padding);
    drawGameboard();
  }
}
