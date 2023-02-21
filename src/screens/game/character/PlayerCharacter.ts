import Character from "./Character";

export default class PlayerCharacter extends Character {
  constructor() {
    super("player-character.png");
    this.type = "player";

    this.hp = 4;
    this.maxHp = 4;
  }

  get isPlayer() {
    return true;
  }
}
