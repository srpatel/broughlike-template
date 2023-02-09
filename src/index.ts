import Game from "Game";
import * as PIXI from "pixi.js";

import "./style.css";

let timeout: any = null;

function onLoad() {
  function doResize() {
    game.resize();
  }

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    resolution: window.devicePixelRatio || 1,
  });

  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  app.renderer.plugins.interaction.interactionFrequency = 60;

  const game = new Game(app);

  clearTimeout(timeout);
  timeout = setTimeout(doResize, 1000);

  document.body.appendChild(app.view);
  document.body.style.backgroundColor =
  "#" + Game.BACKGROUND_COLOUR.toString(16).padStart(6, "0");

  window.onresize = function (event: Event) {
    doResize();
    clearTimeout(timeout);
    timeout = setTimeout(doResize, 500);
  };

  window.onkeydown = function (event: KeyboardEvent) {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(
        event.code
      ) > -1
    ) {
      event.preventDefault();
    }
    game.keydown(event.code);
  };
}

if (window.hasOwnProperty("cordova")) {
  document.addEventListener("deviceready", onLoad, false);
} else {
  window.onload = onLoad;
}
