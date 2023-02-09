import * as PIXI from "pixi.js";
import Game from "Game";
import { Font } from "utils";

import * as _ from "underscore";

import GameScreen from "./GameScreen";

export default class GameOverModal extends PIXI.Container {
  game: GameScreen;
  scoresTable: PIXI.Container;

  constructor(game: GameScreen) {
    super();

    this.game = game;

    // Leaderboard
    const titleLabel = new PIXI.BitmapText(
      "Game Over",
      Font.makeFontOptions("small")
    );
    titleLabel.anchor.set(0.5, 0.5);
    titleLabel.position.x = Game.TARGET_WIDTH / 2;
    titleLabel.position.y = 20;
    this.addChild(titleLabel);

    {
      // Your score
      const lbl = new PIXI.BitmapText(
        "Your score - " + game.score,
        Font.makeFontOptions("small")
      );
      lbl.anchor.set(0.5, 0.5);
      lbl.position.x = Game.TARGET_WIDTH / 2;
      lbl.position.y = 55;
      this.addChild(lbl);
    }

    // Play Again buttons
    {
      const button = new PIXI.BitmapText(
        "[ Return to Menu ]",
        Font.makeFontOptions("small")
      );
      button.anchor.set(0.5, 0.5);
      button.position.x = Game.TARGET_WIDTH / 2;
      button.position.y = 115;
      this.addChild(button);

      // Clicker
      const clicker = PIXI.Sprite.from(PIXI.Texture.WHITE);
      clicker.tint = 0xff0000;
      clicker.alpha = 0;
      clicker.anchor.set(0.5, 0.5);
      clicker.width = button.width * 1.5;
      clicker.height = button.height * 2;
      clicker.position.set(button.position.x, button.position.y);
      this.addChild(clicker);
      const ee = clicker as any;
      ee.interactive = true;
      ee.on("pointertap", () => {
        Game.instance.gotoMenuScreen();
      });
    }
  }
}
