import * as PIXI from "pixi.js";
import Game from "Game";
import { Button } from "ui";
import { Font } from "utils";
import Screen from "../Screen";

export default class MenuScreen extends Screen {
  static PADDING = 20;
  startButton: Button;
  logo: PIXI.BitmapText;
  w: number;
  h: number;
  constructor() {
    super();

    // Logo at top
    this.logo = new PIXI.BitmapText("TEMPLATE", Font.makeFontOptions("large"));
    this.logo.anchor.set(0.5, 0);
    this.logo.tint = 0xffffff;
    this.addChild(this.logo);

    // Button to continue or start
    this.startButton = new Button("Start", () => {
      // Start new game!
      Game.instance.gotoGameScreen();
    });
    this.addChild(this.startButton);
  }

  resize(width: number, height: number) {
    this.w = width;
    this.h = height;

    this.logo.position.set(width / 2, MenuScreen.PADDING);

    this.startButton.position.set(
      width / 2,
      height - this.startButton.height / 2 - MenuScreen.PADDING
    );
  }

  keydown(code: string) {
    if (code == "Enter") {
      this.startButton.onclick();
      return;
    }
  }
}
