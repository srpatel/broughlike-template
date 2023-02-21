import Engine from "./engine/Engine";
import LocalStorageEngine from "./engine/LocalStorageEngine";
import MemoryEngine from "./engine/MemoryEngine";

import GameScreen from "../screens/game/GameScreen";
import DungeonGrid from "../screens/game/grid/DungeonGrid";
import Wall from "../screens/game/grid/Wall";
import { PlayerCharacter, EnemyCharacter, Character } from "../screens/game/character";
import type { CharacterType } from "../screens/game/character/Character";
import { Coords } from "utils";

export default class Save {
  static engine: Engine;
  static initialise() {
    if (LocalStorageEngine.isSupported()) {
      this.engine = new LocalStorageEngine();
    } else {
      this.engine = new MemoryEngine();
    }
  }

  // Coords
  private static serialiseCoords(coords: Coords) {
    if (!coords) return null;
    return [coords.col, coords.row];
  }
  private static deserialiseCoords(coords: any): Coords {
    if (!coords) return null;
    return new Coords(coords[0], coords[1]);
  }

  // Walls
  private static serialiseWalls(walls: Wall[]) {
    return walls.map((w) => {
      return {
        from: this.serialiseCoords(w.from),
        to: this.serialiseCoords(w.to),
      };
    });
  }
  private static deserialiseWalls(walls: any): Wall[] {
    return walls.map(
      (w: any) =>
        new Wall(this.deserialiseCoords(w.from), this.deserialiseCoords(w.to))
    );
  }

  // Characters
  private static serialiseCharacters(characters: Character[]) {
    return characters.map((c) => {
      return {
        type: c.type,
        coords: this.serialiseCoords(c.coords),
        hp: c.hp,
      };
    });
  }
  private static deserialiseCharacters(characters: any): Character[] {
    return characters.map(
      (c: any) => this.createCharacter(c.type, c.hp, this.deserialiseCoords(c.coords))
    );
  }
  private static createCharacter(type: CharacterType, hp: number, coords: Coords) {
    let c;
    if (type === "player") {
      c = new PlayerCharacter();
    } else {
      c = new EnemyCharacter(type);
    }
    c.coords = coords;
    c.hp = hp;
    return c;
  }

  // Dungeon grid
  private static serialiseDungeonGrid(dungeonGrid: DungeonGrid) {
    return {
      characters: this.serialiseCharacters(dungeonGrid.characters),
      walls: this.serialiseWalls(dungeonGrid.walls),
      edgeWalls: this.serialiseWalls(dungeonGrid.edgeWalls),
      dimension: dungeonGrid.dimension,
      exitCoords: this.serialiseCoords(dungeonGrid.exitCoords),
      exitDir: this.serialiseCoords(dungeonGrid.exitDir),
    };
  }
  private static deserialiseDungeonGrid(gameScreen: GameScreen, data: any) {
    const dungeonGrid = new DungeonGrid(gameScreen, data.dimension);
    const chars = this.deserialiseCharacters(data.characters);
    for (const c of chars) {
        dungeonGrid.addCharacter(c);
    }
    dungeonGrid.walls = this.deserialiseWalls(data.walls);
    dungeonGrid.edgeWalls = this.deserialiseWalls(data.edgeWalls);
    dungeonGrid.exitCoords = this.deserialiseCoords(data.exitCoords);
    dungeonGrid.exitDir = this.deserialiseCoords(data.exitDir);
    dungeonGrid.drawWalls(dungeonGrid.walls);
    dungeonGrid.updateExitCoords();
    return dungeonGrid;
  }

  // Game state
  private static serialiseGameState(gameScreen: GameScreen) {
    return {
      level: gameScreen.level,
      state: gameScreen.state,
      score: gameScreen.score,
      dungeonGrid: this.serialiseDungeonGrid(gameScreen.dungeonGrid),
    };
  }
  private static deserialiseGameState(gameScreen: GameScreen, data: any) {
    gameScreen.level = data.level;
    gameScreen.state = data.state;
    gameScreen.score = data.score;

    // Remove the old dungeon grid:
    if (gameScreen.dungeonGrid) {
        gameScreen.gameContainer.removeChild(gameScreen.dungeonGrid);
    }
    gameScreen.dungeonGrid = this.deserialiseDungeonGrid(gameScreen, data.dungeonGrid);
    gameScreen.gameContainer.addChild(gameScreen.dungeonGrid);

    const pc = gameScreen.dungeonGrid.characters.find(c => c.isPlayer);
    gameScreen.playerCharacter = pc;
    gameScreen.incScore(0);
  }

  static hasGameState() {
    return !!this.engine.load("currentGameState");
  }

  static saveGameState(gameScreen: GameScreen) {
    // Save game state...
    const data = this.serialiseGameState(gameScreen);
    this.engine.save("currentGameState", data);
  }

  static loadGameState(gameScreen: GameScreen) {
    // Save game state...
    const data = this.engine.load("currentGameState");
    if (data) {
        // Load data into gameScreen...
        this.deserialiseGameState(gameScreen, data);
        return true;
    }
    return false;
  }

  static clearGameState() {
    this.engine.remove("currentGameState");
  }
}
