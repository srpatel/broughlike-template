import Character from "./Character";
import * as _ from "underscore";

export default class EnemyCharacter extends Character {
  hp: number;
  constructor() {
    const spriteName = "enemy-character.png";
    super(spriteName);

    this.type = "enemy";
    this.hp = 1;
  }

  damage(amount: number): boolean {
    this.hp -= amount;

    return this.hp <= 0;
  }
}
