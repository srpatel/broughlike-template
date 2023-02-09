import Character from "./Character";

export default class PlayerCharacter extends Character {
  constructor() {
    super("player-character.png");
    this.type = "player";
  }
}
