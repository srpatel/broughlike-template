import * as PIXI from "pixi.js";
import { Coords } from "utils";
import * as _ from "underscore";

export default class Wall extends PIXI.Container {
  static CONNECTION_PREFERRED_RATIO = 0.6;
  static PREDETERMINED_LAYOUTS: any = { shrine: [] };
  from: Coords;
  to: Coords;
  sprite: PIXI.Sprite;
  constructor(from: Coords, to: Coords) {
    super();

    this.from = from;
    this.to = to;

    this.sprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.sprite.tint = 0x4d3206;

    this.addChild(this.sprite);
  }

  setCellSize(cellSize: number) {
    const withSize = cellSize * 1.1;
    const againstSize = 5;
    this.sprite.width = this.isHorizontal ? withSize : againstSize;
    this.sprite.height = this.isHorizontal ? againstSize : withSize;
  }

  blocks(start: Coords, dx: number, dy: number) {
    if (this.isHorizontal) {
      if (dy == 0) return false;
      if (dy < 0 && this.from.equals(start)) {
        // Hitting a wall
        return true;
      }
      if (
        dy > 0 &&
        this.from.col == start.col &&
        this.from.row == start.row + 1
      ) {
        // Hitting a wall
        return true;
      }
    }
    if (!this.isHorizontal) {
      if (dx == 0) return false;
      if (dx < 0 && this.from.equals(start)) {
        // Hitting a wall
        return true;
      }
      if (
        dx > 0 &&
        this.from.col == start.col + 1 &&
        this.from.row == start.row
      ) {
        // Hitting a wall
        return true;
      }
    }
    return false;
  }

  get isHorizontal(): boolean {
    return this.from.row == this.to.row;
  }

  static floodFillAddToQueue(
    Q: number[][],
    n: number[],
    dx: number,
    dy: number,
    dimension: number,
    walls: Wall[],
    prospective: Wall,
    flood: boolean[][]
  ) {
    const col = n[0] + dx;
    const row = n[1] + dy;
    const from = new Coords(n[0], n[1]);

    // If not in bounds, don't add to Q
    if (col < 0 || row < 0) return;
    if (col >= dimension || row >= dimension) return;
    // If already flooded, don't add
    if (flood[col][row]) return;
    // If a wall blocks, don't add
    for (const w of walls) {
      if (w.blocks(from, dx, dy)) return;
    }
    // If the prospective blocks, don't add
    if (prospective.blocks(from, dx, dy)) return;
    Q.push([col, row]);
  }

  static floodFill(
    flood: boolean[][],
    walls: Wall[],
    prospective: Wall,
    dimension: number
  ): boolean {
    for (let i = 0; i < flood.length; i++) {
      for (let j = 0; j < flood[i].length; j++) {
        flood[i][j] = false;
      }
    }

    const Q = [];
    Q.push([0, 0]);

    while (Q.length > 0) {
      const n = Q.pop();
      flood[n[0]][n[1]] = true;
      Wall.floodFillAddToQueue(
        Q,
        n,
        0,
        1,
        dimension,
        walls,
        prospective,
        flood
      );
      Wall.floodFillAddToQueue(
        Q,
        n,
        0,
        -1,
        dimension,
        walls,
        prospective,
        flood
      );
      Wall.floodFillAddToQueue(
        Q,
        n,
        1,
        0,
        dimension,
        walls,
        prospective,
        flood
      );
      Wall.floodFillAddToQueue(
        Q,
        n,
        -1,
        0,
        dimension,
        walls,
        prospective,
        flood
      );
    }

    for (let i = 0; i < flood.length; i++) {
      for (let j = 0; j < flood[i].length; j++) {
        if (!flood[i][j]) return false;
      }
    }

    return true;
  }

  static edges(dimension: number) {
    // Generate walls which go all around the edges
    const walls: Wall[] = [];
    for (let edge = 0; edge < 4; edge++) {
      for (let i = 0; i < dimension; i++) {
        const startCoords = new Coords(0, 0);
        const endCoords = new Coords(0, 0);
        if (edge == 0 || edge == 2) {
          // Top/bottom
          startCoords.col = i;
          endCoords.col = i + 1;
          startCoords.row = edge == 0 ? 0 : dimension;
          endCoords.row = startCoords.row;
        } else {
          // Left/right
          startCoords.row = i;
          endCoords.row = i + 1;
          startCoords.col = edge == 1 ? 0 : dimension;
          endCoords.col = startCoords.col;
        }
        walls.push(new Wall(startCoords, endCoords));
      }
    }
    return walls;
  }

  static randomLayout(numWalls: number, dimension: number): Wall[] {
    const walls: Wall[] = [];

    const flood: boolean[][] = [];
    for (let i = 0; i < dimension; i++) {
      const col: boolean[] = [];
      for (let j = 0; j < dimension; j++) {
        col.push(false);
      }
      flood.push(col);
    }

    // Create N wall segments. If a wall segment would create a blockage, don't add it.
    let limit = 0;
    while (walls.length < numWalls) {
      if (limit++ > 1000) {
        break;
      }

      let prospective: Wall = null;
      if (walls.length > 0 && Math.random() < Wall.CONNECTION_PREFERRED_RATIO) {
        // Try to join onto an existing wall
        const prevWall = _.sample(walls);
        const connectingWalls = [];
        if (prevWall.isHorizontal) {
          connectingWalls.push(
            // 2 parallel
            [prevWall.from.clone().add(-1, 0), prevWall.to.clone().add(-1, 0)],
            [prevWall.from.clone().add(1, 0), prevWall.to.clone().add(1, 0)],
            // 4 perpendicular
            [prevWall.from.clone(), prevWall.from.clone().add(0, 1)],
            [prevWall.from.clone().add(0, -1), prevWall.from.clone()],
            [prevWall.to.clone(), prevWall.to.clone().add(0, 1)],
            [prevWall.to.clone().add(0, -1), prevWall.to.clone()]
          );
        } else {
          connectingWalls.push(
            // 2 parallel
            [prevWall.from.clone().add(0, -1), prevWall.to.clone().add(0, -1)],
            [prevWall.from.clone().add(0, 1), prevWall.to.clone().add(0, 1)],
            // 4 perpendicular
            [prevWall.from.clone(), prevWall.from.clone().add(1, 0)],
            [prevWall.from.clone().add(-1, 0), prevWall.from.clone()],
            [prevWall.to.clone(), prevWall.to.clone().add(1, 0)],
            [prevWall.to.clone().add(-1, 0), prevWall.to.clone()]
          );
        }
        // Remove any which are duplicated, or out of bounds
        const viableConnectingWalls: Coords[][] = [];
        outer: for (const w of connectingWalls) {
          // If not in bounds, don't add to Q
          if (w[0].col < 0 || w[0].row < 0) continue;
          if (w[0].col >= dimension || w[0].row >= dimension) continue;
          if (w[1].col < 0 || w[1].row < 0) continue;
          if (w[1].col >= dimension || w[1].row >= dimension) continue;

          const isHorizontal = w[0].row == w[1].row;
          if (isHorizontal) {
            // If it's horizontal, you can't go on top or bottom
            if (w[0].row == 0 || w[0].row == dimension - 1) continue;
          } else {
            // If it's vertical, you can't go on either edge
            if (w[0].col == 0 || w[0].col == dimension - 1) continue;
          }
          // If another wall here, don't add
          for (const w2 of walls) {
            if (w2.from.equals(w[0]) && w2.to.equals(w[1])) {
              continue outer;
            }
          }
          viableConnectingWalls.push(w);
        }
        if (viableConnectingWalls.length > 0) {
          const coords = _.sample(viableConnectingWalls);
          prospective = new Wall(coords[0], coords[1]);
        }
      }

      if (prospective == null) {
        // Random wall
        const horizontal = Math.random() < 0.5;
        const dx = horizontal ? 1 : 0;
        const dy = horizontal ? 0 : 1;

        let startX = null,
          startY = null;
        startX = _.random(horizontal ? 0 : 1, dimension - 1);
        startY = _.random(horizontal ? 1 : 0, dimension - 1);

        const from = new Coords(startX, startY);
        const to = from.clone().add(dx, dy);

        // If there is already a wall here, skip!
        let alreadyExists = false;
        for (const w of walls) {
          if (w.from.equals(from) && w.to.equals(to)) {
            alreadyExists = true;
            break;
          }
        }
        if (alreadyExists) continue;

        prospective = new Wall(from, to);
      }

      // If we can't flood fill, skip!
      const canFloodFill = Wall.floodFill(flood, walls, prospective, dimension);
      if (!canFloodFill) continue;

      walls.push(prospective);
    }

    return walls;
  }
}
