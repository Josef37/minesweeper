window.addEventListener('DOMContentLoaded', main);

function main() {
  let canvas = document.getElementById('gameboard'),
      context = canvas.getContext('2d'),
      width = canvas.width = window.innerWidth,
      height = canvas.height = window.innerHeight,
      padding = 50;

  let gameboard = new Gameboard(10, 10, 10);
  context.translate(padding, padding);
  drawGameboard();
  canvas.addEventListener("click", onclick);
  canvas.addEventListener("contextmenu", onclick);

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
}
