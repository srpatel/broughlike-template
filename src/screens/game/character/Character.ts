import * as PIXI from "pixi.js";
import Game from "Game";
import { Coords } from "utils";
import type { EnemyCharacterType } from "./EnemyCharacter";

export type CharacterType = "player" | EnemyCharacterType;

export default class Character extends PIXI.Container {
  coords: Coords;
  _hp: number = 1;
  _maxHp: number = 1;
  type: CharacterType;
  sprite: PIXI.Sprite;
  heartsHolder: PIXI.Container;
  constructor(backgroundPath: string) {
    super();

    this.coords = new Coords(0, 0);

    this.sprite = PIXI.Sprite.from(Game.tex(backgroundPath));
    this.sprite.anchor.set(0.5, 1);
    this.addChild(this.sprite);

    // Add holder for hearts
    this.heartsHolder = new PIXI.Container();
    this.addChild(this.heartsHolder);
  }

  get isEnemy() {
    return false;
  }

  get isPlayer() {
    return false;
  }

  get hp() {
    return this._hp;
  }
  set hp(hp: number) {
    this._hp = hp;
    // CHANGE WHITE/REDNESS
    for (let i = 0; i < this.heartsHolder.children.length; i++) {
      const heart = this.heartsHolder.children[i];
      (heart as PIXI.Sprite).tint = (i < this._hp) ? 0xff0000 : 0xffffff;
    }
  }

  get maxHp() {
    return this._maxHp;
  }
  set maxHp(maxHp: number) {
    this._maxHp = maxHp;

    this.heartsHolder.removeChildren();
    for (let i = 0; i < this._maxHp; i++) {
      const heart = PIXI.Sprite.from(Game.tex("heart.png"));
      heart.anchor.set(0.5);
      heart.position.set(
        -(this._maxHp * heart.width)/2 + heart.width * (i + 0.5),
        0
      );
      heart.tint = (i < this._hp) ? 0xff0000 : 0xffffff;
      this.heartsHolder.addChild(heart);
    }
  }

  damage(amount: number): boolean {
    this.hp -= amount;

    return this.hp <= 0;
  }
}
