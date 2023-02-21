import Character from "./Character";
import * as _ from "underscore";

export type EnemyCharacterType = "enemy1" | "enemy2" | "enemy3";

export default class EnemyCharacter extends Character {
  constructor(type: EnemyCharacterType) {
    const spriteName = "enemy-character.png";
    super(spriteName);

    this.type = type;

    if (this.type === "enemy1") {
      this.hp = 1;
      this.maxHp = 1;
    } else if (this.type === "enemy2") {
      this.hp = 2;
      this.maxHp = 2;
    } else if (this.type === "enemy3") {
      this.hp = 3;
      this.maxHp = 3;
    }
  }

  get isEnemy() {
    return true;
  }
}
