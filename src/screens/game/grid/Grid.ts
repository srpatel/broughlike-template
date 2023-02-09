import * as PIXI from "pixi.js";
import { Action, Actions } from "pixi-actions";
import Character from "../character/Character";
import { Coords } from "utils";
import Wall from "./Wall";

export default class Grid extends PIXI.Container {
  dimension: number;
  edgeSize: number;
  constructor(dimension: number) {
    super();
    this.dimension = dimension;
    this.edgeSize = 28 * this.dimension;
  }

  get cellSize(): number {
    return this.edgeSize / this.dimension;
  }

  inBounds(col: number | Coords, row: number = null) {
    let c = 0,
      r = 0;
    if (typeof col == "number") {
      c = col;
      r = row;
    } else {
      c = col.col;
      r = col.row;
    }
    return !(c < 0 || c >= this.dimension || r < 0 || r >= this.dimension);
  }

  makeMoveTo(
    character: Character,
    dx: number = 0,
    dy: number = 0,
    time: number = 0.1
  ): Action {
    return Actions.moveTo(
      character,
      this.cellSize * (character.coords.col + dx) + this.cellSize / 2,
      this.cellSize * (character.coords.row + dy) + this.cellSize - 3,
      time
    );
  }

  setPositionTo(
    actor: PIXI.Container,
    coords: Coords,
    isWall: boolean = false
  ) {
    if (isWall) {
      if ((actor as Wall).isHorizontal) {
        actor.position.set(
          this.cellSize * coords.col + (this.cellSize - actor.width) / 2,
          this.cellSize * coords.row + -actor.height / 2
        );
      } else {
        actor.position.set(
          this.cellSize * coords.col + -actor.width / 2,
          this.cellSize * coords.row + (this.cellSize - actor.height) / 2
        );
      }
    } else {
      actor.position.set(
        this.cellSize * coords.col + this.cellSize / 2,
        this.cellSize * coords.row + this.cellSize - 3
      );
    }
  }
}
