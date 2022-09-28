import Game from "./game/Game";
import * as PIXI from "pixi.js";

import "./style.css";

let game: Game;
let cutout: any;
let timeout: any = null;

function onLoad() {
  function getTargetHeight() {
    const pt = parseInt(getComputedStyle(document.body).paddingTop ?? "0");
    const pb = parseInt(getComputedStyle(document.body).paddingBottom ?? "0");
    return window.innerHeight - pt - pb;
  }

  function doResize() {
    game.resize(window.innerWidth, getTargetHeight());
  }

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: getTargetHeight(),
    antialias: false,
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

  window.onresize = function (event: Event) {
    game.resize(window.innerWidth, getTargetHeight());
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
