import * as PIXI from "pixi.js";
import Game from "Game";
import { Coords } from "utils";

export default class Character extends PIXI.Container {
  coords: Coords;
  type: "player" | "enemy";
  sprite: PIXI.Sprite;
  constructor(backgroundPath: string) {
    super();

    this.coords = new Coords(0, 0);

    this.sprite = PIXI.Sprite.from(Game.tex(backgroundPath));
    this.sprite.anchor.set(0.5, 1);
    this.addChild(this.sprite);
  }

  get isEnemy() {
    return this.type == "enemy";
  }

  get isPlayer() {
    return this.type == "player";
  }

  damage(amount: number): boolean {
    return false;
  }
}
