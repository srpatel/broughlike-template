import * as PIXI from "pixi.js";
import { Actions } from "pixi-actions";
import { Character, EnemyCharacter, PlayerCharacter } from "../character";
import GameScreen from "../GameScreen";
import Grid from "./Grid";
import Wall from "./Wall";
import { Coords } from "utils";
import * as _ from "underscore";
import Game from "Game";

export default class DungeonGrid extends Grid {
  characters: Character[] = [];
  walls: Wall[] = [];
  edgeWalls: Wall[] = [];
  wallsHolder: PIXI.Container = new PIXI.Container();
  charactersHolder: PIXI.Container = new PIXI.Container();
  gameScreen: GameScreen;
  coords: Coords[] = [];
  cellSquares: PIXI.Sprite[][] = [];
  cellStairs: PIXI.Sprite[][] = [];
  exitCoords: Coords;
  exitDir: Coords = null;
  constructor(gameScreen: GameScreen, dimension: number) {
    super(dimension);

    this.gameScreen = gameScreen;

    // Add cell backgrounds
    const background = PIXI.Sprite.from(PIXI.Texture.WHITE);
    background.tint = 0xd3c8a2;
    background.width = this.edgeSize;
    background.height = this.edgeSize;
    background.alpha = 1;
    background.anchor.set(0, 0);
    this.addChild(background);

    for (let i = 0; i < this.dimension; i++) {
      const col1 = [];
      const col2 = [];
      for (let j = 0; j < this.dimension; j++) {
        const cell = PIXI.Sprite.from(PIXI.Texture.WHITE);
        cell.tint = 0;
        cell.alpha = (i + j) % 2 == 0 ? 0 : 0.2;
        cell.width = this.cellSize;
        cell.height = this.cellSize;
        const offset1 = (this.cellSize - cell.width) / 2;
        cell.position.set(
          i * this.cellSize + offset1,
          j * this.cellSize + offset1
        );
        col1.push(cell);
        this.addChild(cell);

        const stair = PIXI.Sprite.from(Game.tex("stairs.png"));
        stair.width = this.cellSize * 0.8;
        stair.height = this.cellSize * 0.8;
        const offset2 = (this.cellSize - stair.width) / 2;
        stair.position.set(
          i * this.cellSize + offset2,
          j * this.cellSize + offset2
        );
        stair.visible = false;
        col2.push(stair);
        this.addChild(stair);
      }
      this.cellSquares.push(col1);
      this.cellStairs.push(col2);
    }

    this.addChild(this.wallsHolder);
    this.addChild(this.charactersHolder);

    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        this.coords.push(new Coords(i, j));
      }
    }
  }

  clearEnemies() {
    for (let i = this.characters.length - 1; i >= 0; i--) {
      const c = this.characters[i];
      if (!c.isPlayer) {
        Actions.fadeOutAndRemove(c, 0.2).play();
        this.characters.splice(i, 1);
      }
    }
  }

  unsetExitCell() {
    this.exitCoords = null;
    this.updateExitCoords();
  }

  setExitCell(minDistanceFromPlayer: number = 7) {
    const possibles = [];
    const backups = [];

    let dijks = null;
    dijks = this.dijkstra(this.gameScreen.playerCharacter.coords, false);

    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        if (i == 2 && j == 2) continue;
        if (
          Game.EXIT_TYPE == "door" &&
          ![0, this.dimension - 1].includes(i) &&
          ![0, this.dimension - 1].includes(j)
        )
          continue;
        if (dijks.distance[i][j] >= minDistanceFromPlayer) {
          possibles.push(new Coords(i, j));
        }
        if (dijks.distance[i][j] >= 3) {
          backups.push(new Coords(i, j));
        }
      }
    }

    if (possibles.length == 0) {
      possibles.push(...backups);
    }

    if (possibles.length == 0) {
      for (let i = 0; i < this.dimension; i++) {
        for (let j = 0; j < this.dimension; j++) {
          if (i == 2 && j == 2) continue;
          if (
            Game.EXIT_TYPE == "door" &&
            ![0, this.dimension - 1].includes(i) &&
            ![0, this.dimension - 1].includes(j)
          )
            continue;
          const c = new Coords(i, j);
          let anyCoincidence = false;
          if (this.gameScreen.playerCharacter.coords.equals(c)) {
            anyCoincidence = true;
            break;
          }
          if (!anyCoincidence) {
            possibles.push(c);
          }
        }
      }
    }

    const coords = _.sample(possibles);
    this.exitCoords = coords;
    if (Game.EXIT_TYPE == "door") {
      const possibleDirs = [];
      if (coords.row == 0) possibleDirs.push(new Coords(0, -1));
      if (coords.row == this.dimension - 1) possibleDirs.push(new Coords(0, 1));
      if (coords.col == 0) possibleDirs.push(new Coords(-1, 0));
      if (coords.col == this.dimension - 1) possibleDirs.push(new Coords(1, 0));
      if (possibleDirs.length > 0) this.exitDir = _.sample(possibleDirs);
    }
    this.updateExitCoords();
  }

  updateExitCoords() {
    if (Game.EXIT_TYPE == "stairs") {
      this.cellStairs.forEach((a, i) =>
        a.forEach(
          (stairs, j) =>
            (stairs.visible =
              this.exitCoords &&
              this.exitCoords.col == i &&
              this.exitCoords.row == j)
        )
      );
    } else {
      // Remove other edge walls (if there are any)
      for (const c of this.edgeWalls) {
        this.wallsHolder.removeChild(c);
      }
      this.edgeWalls = [];

      // Add outer wall
      let walls: Wall[] = Wall.edges(this.dimension);

      // Make hole where exit is
      if (this.exitCoords && this.exitDir) {
        walls = walls.filter(
          (w) => !w.blocks(this.exitCoords, this.exitDir.col, this.exitDir.row)
        );
      }

      // Draw walls
      this.drawWalls(walls);
      this.walls.push(...walls);
      this.edgeWalls.push(...walls);
    }
  }

  getRandomEmptyCell(): Coords {
    let dijks = null;
    dijks = this.dijkstra(this.gameScreen.playerCharacter.coords, false);
    const shuffledCoords = _.shuffle(this.coords);
    for (const coord of shuffledCoords) {
      if (this.exitCoords && this.exitCoords.equals(coord)) continue;
      if (
        !this.getCharacterAt(coord) &&
        (!dijks || dijks.distance[coord.col][coord.row] > 1)
      ) {
        return coord;
      }
    }
    return null;
  }

  generateWalls(numWalls: number) {
    // Delete all old walls
    for (const w of this.walls) {
      Actions.fadeOutAndRemove(w, 0.2).play();
    }
    this.walls = Wall.randomLayout(numWalls, this.dimension);

    // Add some new walls... they must generate any closed areas
    this.drawWalls(this.walls);
  }

  drawWalls(walls: Wall[]) {
    for (const w of walls) {
      w.alpha = 0;
      Actions.fadeIn(w, 0.2).play();
      this.wallsHolder.addChild(w);
      w.setCellSize(this.cellSize);

      // Place in the correct place
      this.setPositionTo(w, w.from, true);
    }
  }

  addCharacter(character: Character) {
    character.scale.set(0.2);
    character.alpha = 0;
    Actions.fadeIn(character, 0.2).play();
    this.characters.push(character);
    this.charactersHolder.addChild(character);

    // Place in the correct place!
    this.setPositionTo(character, character.coords);
  }

  getCharacterAt(col: number | Coords, row: number = null): Character {
    let c = 0;
    let r = 0;
    if (typeof col == "number") {
      c = col;
      r = row;
    } else {
      c = col.col;
      r = col.row;
    }
    for (const char of this.characters) {
      if (char.coords.col == c && char.coords.row == r) {
        return char;
      }
    }
    return null;
  }

  bumpAnimation(character: Character, dx: number, dy: number) {
    const time = 0.1;
    Actions.sequence(
      this.makeMoveTo(character, dx * 0.1, dy * 0.1, time / 2),
      this.makeMoveTo(character, 0, 0, time / 2)
    ).play();
    return time;
  }

  damageEnemy(targetCharacter: EnemyCharacter) {
    let delay = 0;
    const didDie = targetCharacter.damage(1);
    if (didDie) {
      // Remove from characters array
      const index = this.characters.indexOf(targetCharacter);
      if (index >= 0) {
        this.characters.splice(index, 1);
      }
      // Remove from charactersHolder
      targetCharacter.position.x += this.position.x;
      targetCharacter.position.y += this.position.y;
      this.charactersHolder.removeChild(targetCharacter);
      delay = 0;
    }
    return delay;
  }

  moveCharacter(
    character: Character,
    dx: number,
    dy: number
  ): { didMove: boolean; delay: number; wentThroughExit: boolean } {
    // Check the target space is available
    const targetCoord = character.coords.clone().add(dx, dy);

    // Edge of grid!
    if (!this.inBounds(targetCoord)) {
      if (
        this.exitCoords &&
        character.coords.equals(this.exitCoords) &&
        Game.EXIT_TYPE == "door" &&
        this.exitDir &&
        this.exitDir.equals(dx, dy)
      ) {
        // We are going through the exit!
        return { didMove: true, delay: 0, wentThroughExit: true };
      }
      // Hitting the edge of the grid
      Game.instance.playSound("bump");
      const delay = this.bumpAnimation(character, dx, dy);
      return { didMove: false, delay, wentThroughExit: false };
    }

    // Hitting a wall?
    if (this.doesWallSeparate(character.coords, dx, dy)) {
      Game.instance.playSound("bump");
      const delay = this.bumpAnimation(character, dx, dy);
      return { didMove: false, delay, wentThroughExit: false };
    }

    // Is there another character here?
    try {
      const targetCharacter = this.getCharacterAt(targetCoord);
      if (targetCharacter) {
        let delay = this.bumpAnimation(character, dx, dy);
        if (character.isPlayer && targetCharacter.isEnemy) {
          // Attack the character
          Game.instance.playSound("attack");
          delay += this.damageEnemy(targetCharacter as EnemyCharacter);
          return { didMove: true, delay, wentThroughExit: false };
        } else if (character.isEnemy && targetCharacter.isPlayer) {
          const player = targetCharacter as PlayerCharacter;
          // Take a damage!
          if (player.damage(1)) {
            this.gameScreen.gameOver();
          }
          return { didMove: true, delay, wentThroughExit: false };
        } else {
          return { didMove: false, delay, wentThroughExit: false };
        }
      }
    } catch (e) {
      // The game is over
      this.gameScreen.gameOver();
      return { didMove: true, delay: 0, wentThroughExit: false };
    }

    // Move the character
    if (character.isPlayer) {
      Game.instance.playSound(["step1", "step2", "step3", "step4"]);
    }
    character.coords.set(targetCoord);

    // Animate to the new position
    this.makeMoveTo(character).play();
    return { didMove: true, delay: 0.05, wentThroughExit: false };
  }

  doesWallSeparate(start: Coords, dx: number, dy: number) {
    for (const w of this.walls) {
      if (w.blocks(start, dx, dy)) {
        return true;
      }
    }
    return false;
  }

  moveEnemies() {
    let delay = 0;

    // 1. Dijkstra the grid, ignoring enemies
    // Pick the closest character
    const dijks = this.dijkstra(this.gameScreen.playerCharacter.coords, false);
    const enemiesAndDistances = [];
    for (const char of this.characters) {
      if (char.isEnemy) {
        let distance = dijks.distance[char.coords.col][char.coords.row];
        enemiesAndDistances.push({
          distance,
          char,
        });
      }
    }

    // 2. Sort by closest to furthest
    let sortedEnemies = _.sortBy(enemiesAndDistances, "distance");

    // 3. For each enemy, pathfind (properly) to the player
    let atLeastOneMove = false;
    for (let tries = 0; tries < 5; tries++) {
      const tryAgainLater = [];
      for (const e of sortedEnemies) {
        const char = e.char;

        const dijks = this.dijkstra(
          this.gameScreen.playerCharacter.coords,
          true,
          char.coords
        );

        // Move in the direction which has the lowest distance
        let targetCol = dijks.col[char.coords.col][char.coords.row];
        let targetRow = dijks.row[char.coords.col][char.coords.row];

        if (targetCol == null || targetRow == null) {
          const neighbours: Coords[] = [];
          this.addPotentialNeighbour(neighbours, char.coords, 1, 0);
          this.addPotentialNeighbour(neighbours, char.coords, 0, 1);
          this.addPotentialNeighbour(neighbours, char.coords, -1, 0);
          this.addPotentialNeighbour(neighbours, char.coords, 0, -1);
          if (neighbours.length > 0) {
            // If there is no good route, then random direction
            const dir = _.sample(neighbours);
            targetCol = dir.col;
            targetRow = dir.row;
          } else {
            // If there is no route at all, then wait, we'll try again in a bit
            tryAgainLater.push(e);
            continue;
          }
        }

        const dx = targetCol - char.coords.col;
        const dy = targetRow - char.coords.row;
        atLeastOneMove = true;
        delay = Math.max(this.moveCharacter(char, dx, dy).delay, delay);
      }

      if (tryAgainLater.length == 0) {
        break;
      } else {
        sortedEnemies = tryAgainLater;
      }
    }

    return { didMove: true, delay };
  }

  addPotentialNeighbour(
    list: Coords[],
    coords: Coords,
    dx: number,
    dy: number
  ) {
    if (!this.inBounds(coords.col + dx, coords.row + dy)) {
      // Out of bounds, ignore!
      return;
    }
    if (this.doesWallSeparate(coords, dx, dy)) {
      // There is no path, ignore!
      return;
    }
    const char = this.getCharacterAt(coords.col + dx, coords.row + dy);
    if (char && char.isEnemy) {
      // There is a monster on the target square, ignore!
      return;
    }
    list.push(coords.clone().add(dx, dy));
  }

  updateTentativeDistance(
    withEnemiesAsObstacles: boolean,
    tentativeDistance: number[][],
    tentativeSourceCol: number[][],
    tentativeSourceRow: number[][],
    coords: Coords,
    dx: number,
    dy: number
  ) {
    if (!this.inBounds(coords.col + dx, coords.row + dy)) {
      // Out of bounds, ignore!
      return;
    }
    if (this.doesWallSeparate(coords, dx, dy)) {
      // There is no path, ignore!
      return;
    }
    if (withEnemiesAsObstacles) {
      const char = this.getCharacterAt(coords.col + dx, coords.row + dy);
      if (char && char.isEnemy) {
        // There is a monster on the target square, ignore!
        return;
      }
    }
    const newTentativeDistance = tentativeDistance[coords.col][coords.row] + 1;
    if (
      tentativeDistance[coords.col + dx][coords.row + dy] > newTentativeDistance
    ) {
      tentativeDistance[coords.col + dx][coords.row + dy] =
        newTentativeDistance;
      tentativeSourceCol[coords.col + dx][coords.row + dy] = coords.col;
      tentativeSourceRow[coords.col + dx][coords.row + dy] = coords.row;
    }
  }

  dijkstra(
    target: Coords,
    withEnemiesAsObstacles: boolean,
    stopAt: Coords = null
  ): { distance: number[][]; col: number[][]; row: number[][] } {
    const current = target.clone();

    const visited: boolean[][] = [];
    const tentativeDistance: number[][] = [];
    const tentativeSourceCol: number[][] = [];
    const tentativeSourceRow: number[][] = [];
    for (let i = 0; i < this.dimension; i++) {
      // col
      const c1 = [];
      const c2 = [];
      const c3 = [];
      const c4 = [];
      for (let j = 0; j < this.dimension; j++) {
        // row
        c1.push(false);
        if (target.row == j && target.col == i) {
          c2.push(0);
        } else {
          c2.push(99999);
        }
        c3.push(null);
        c4.push(null);
      }
      visited.push(c1);
      tentativeDistance.push(c2);
      tentativeSourceCol.push(c3);
      tentativeSourceRow.push(c4);
    }

    do {
      // Consider all unvisited neighbours of `current`
      const utd = (dx: number, dy: number) => {
        this.updateTentativeDistance(
          stopAt && stopAt.equals(current.col + dx, current.row + dy)
            ? false
            : withEnemiesAsObstacles,
          tentativeDistance,
          tentativeSourceCol,
          tentativeSourceRow,
          current,
          dx,
          dy
        );
      };
      utd(1, 0);
      utd(-1, 0);
      utd(0, -1);
      utd(0, 1);

      // Mark current as visited
      visited[current.col][current.row] = true;

      // Stop if we've connected our two target points
      if (stopAt && stopAt.equals(current)) break;

      let smallestTentativeDistance = 9999999;
      let smallests = [];
      for (let i = 0; i < this.dimension; i++) {
        for (let j = 0; j < this.dimension; j++) {
          if (visited[i][j]) continue;
          if (
            smallests.length == 0 ||
            tentativeDistance[i][j] < smallestTentativeDistance
          ) {
            smallestTentativeDistance = tentativeDistance[i][j];
            smallests = [];
          }
          if (tentativeDistance[i][j] == smallestTentativeDistance) {
            smallests.push([i, j]);
          }
        }
      }

      // If there are no unvisited, we are done
      if (smallests.length == 0) break;

      // Otherwise, set current to unvisited with smallest tentative
      const randomSmallest = _.sample(smallests);
      current.set(randomSmallest[0], randomSmallest[1]);
    } while (true);

    // Return the dijkstra map for the whole grid
    return {
      distance: tentativeDistance,
      col: tentativeSourceCol,
      row: tentativeSourceRow,
    };
  }
}
