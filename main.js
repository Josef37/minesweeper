window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas = document.getElementById('gameboard'),
      context = canvas.getContext('2d'),
      width,
      height,
      padding = 50;

  let gameboard = new Gameboard(10, 10, 10);
  resizeCanvas();

  canvas.addEventListener("click", onclick);
  canvas.addEventListener("contextmenu", onclick);
  canvas.addEventListener("mousemove",
    event => gameboard.highlight(context, event.clientX - padding, event.clientY - padding));
  window.addEventListener("resize", resizeCanvas);

  function onclick(event) {
    let x = event.clientX - padding,
        y = event.clientY - padding;
    if(event.button == 0) {
      gameboard.doAction(x, y);
    } else if(event.button == 2) {
      if(gameboard.gameover) {
        gameboard.reset();
      } else {
        gameboard.markCell(x, y);
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
