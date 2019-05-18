window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas = document.getElementById('gameboard'),
      context = canvas.getContext('2d'),
      width,
      height,
      padding = 50;

  let gameboard = new Gameboard(3, 3, 3);
  resizeCanvas();

  canvas.addEventListener("click", onclick);
  canvas.addEventListener("contextmenu", onclick);
  canvas.addEventListener("mousemove",
    event => gameboard.highlight(context, event.clientX - padding, event.clientY - padding));
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("keypress", (event) => {
    if(event.key === "s") {
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
