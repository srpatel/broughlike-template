import * as PIXI from "pixi.js";
import { Actions } from "pixi-actions";
import Game from "Game";
import Screen from "../Screen";
import { Font } from "utils";

import DungeonGrid from "./grid/DungeonGrid";
import { PlayerCharacter, EnemyCharacter } from "./character";
import GameOverModal from "./GameOverModal";

import * as _ from "underscore";

type GameState = "play" | "gameover";

export default class GameScreen extends Screen {
  playerCharacter: PlayerCharacter;
  dungeonGrid: DungeonGrid;
  darkOverlay: PIXI.Container;
  gameContainer: PIXI.Container;

  gameOverModal: GameOverModal;

  readyToMove: boolean;
  queuedMove: { dx: number; dy: number };

  level: number;

  state: GameState = "play";

  modals: PIXI.Container[] = [];

  score: number;
  scoreLabel: PIXI.BitmapText;

  prevWidth: number = 0;
  prevHeight: number = 0;

  constructor() {
    super();

    // Setup
    this.readyToMove = true;
    this.queuedMove = null;
    this.level = 0;
    this.score = 0;
    this.gameContainer = new PIXI.Container();
    this.addChild(this.gameContainer);

    // Score
    this.scoreLabel = new PIXI.BitmapText("0", Font.makeFontOptions("small"));
    this.scoreLabel.anchor.set(0.5);
    this.scoreLabel.tint = 0xffffff;
    this.gameContainer.addChild(this.scoreLabel);

    // Add a character
    this.playerCharacter = new PlayerCharacter();
    this.playerCharacter.coords.set(2, 4);

    // Add some enemies
    this.nextLevel();

    // Dark overlay
    this.darkOverlay = new PIXI.Container();
    this.darkOverlay.visible = false;
    {
      const rect = PIXI.Sprite.from(PIXI.Texture.WHITE);
      rect.tint = 0;
      rect.alpha = 0.8;
      this.darkOverlay.addChild(rect);
    }
  }

  incScore(amt: number) {
    this.score += amt;
    this.scoreLabel.text = "" + this.score;
  }

  showDarkOverlay(delay: number = 0, blur: boolean = true) {
    this.darkOverlay.visible = true;
    this.darkOverlay.alpha = 0;
    Actions.sequence(
      Actions.delay(delay),
      Actions.fadeIn(this.darkOverlay, 0.2)
    ).play();
  }

  hideDarkOverlay(delay: number = 0) {
    Actions.sequence(
      Actions.delay(delay),
      Actions.runFunc(() => {
        this.darkOverlay.visible = false;
        this.darkOverlay.alpha = 0;
      })
    ).play();
  }

  gameOver() {
    this.state = "gameover";
    this.showDarkOverlay(0.5, false);

    this.gameOverModal = new GameOverModal(this);
    this.gameOverModal.alpha = 0;
    Actions.sequence(
      Actions.delay(2),
      Actions.fadeIn(this.gameOverModal, 0.2)
    ).play();
    this.addChild(this.gameOverModal);
    this.resizeAgain();
  }

  nextLevel() {
    this.incScore(1);

    this.level++;

    this.readyToMove = true;

    if (this.dungeonGrid) {
      // Fade this one out...
      Actions.fadeOutAndRemove(this.dungeonGrid, 0.5).play();
    }

    this.dungeonGrid = new DungeonGrid(this, Game.DIMENSION);
    this.dungeonGrid.alpha = 0;
    Actions.fadeIn(this.dungeonGrid, 0.5).play();
    this.dungeonGrid.addCharacter(this.playerCharacter);
    this.dungeonGrid.clearEnemies();
    this.dungeonGrid.generateWalls(Math.min(3 + this.level, 8));
    this.dungeonGrid.setExitCell();

    this.gameContainer.addChild(this.dungeonGrid);
    this.resizeAgain();

    const monsterLevel = Math.min(this.level, 20);
    const numEnemies =
      2 +
      Math.min(5, Math.floor(monsterLevel / 5)) +
      Math.min(10, Math.max(0, monsterLevel - 40));
    this.spawnEnemy(numEnemies);
  }

  spawnEnemy(n: number) {
    for (let i = 0; i < n; i++) {
      const enemyCharacter = new EnemyCharacter();
      // Random empty cell
      const coord = this.dungeonGrid.getRandomEmptyCell();
      if (!coord) return;
      enemyCharacter.coords.set(coord.col, coord.row);
      this.dungeonGrid.addCharacter(enemyCharacter);
    }
  }

  pumpQueuedMove() {
    if (this.queuedMove) {
      this.doMove(this.queuedMove.dx, this.queuedMove.dy);
      this.queuedMove = null;
    }
  }

  doMove(dx: number, dy: number) {
    if (this.state != "play") {
      // Can't move!
      return;
    }
    // 1. If you aren't yet ready to move, then queue the direction
    if (this.readyToMove) {
      // 2. Otherwise, do the move
      const moveResult = this.dungeonGrid.moveCharacter(
        this.playerCharacter,
        dx,
        dy
      );

      // 3. If the move was successful, then say we aren't ready to move yet
      if (moveResult.wentThroughExit) {
        // Load in new level
        // Snazzy animation too, if I could handle it!
        this.nextLevel();
      } else if (moveResult.didMove) {
        this.postMove(moveResult.delay);
      } else {
        this.readyToMove = false;

        // After a delay, let the player move again
        Actions.sequence(
          Actions.delay(moveResult.delay),
          Actions.runFunc(() => {
            this.readyToMove = true;
            this.pumpQueuedMove();
          })
        ).play();
      }
    } else {
      this.queuedMove = { dx, dy };
    }
  }

  postMove(delay: number) {
    this.readyToMove = false;

    // Any character on exit
    let onExit = false;
    if (Game.EXIT_TYPE == "stairs" && this.dungeonGrid.exitCoords) {
      if (this.dungeonGrid.exitCoords.equals(this.playerCharacter.coords)) {
        onExit = true;
      }
    }

    if (onExit) {
      this.nextLevel();
    } else {
      Actions.sequence(
        Actions.delay(delay),
        Actions.runFunc(() => {
          if (this.state != "gameover") {
            this.doEnemyMove();
          }
        })
      ).play();
    }
  }

  doEnemyMove() {
    // Move enemies, after a delay!
    const enemyMoveResult = this.dungeonGrid.moveEnemies();

    let delay = enemyMoveResult.delay;

    // After a delay, let the player move again
    // Fudge this value, I like to be able to move really soon
    Actions.sequence(
      Actions.delay(delay),
      Actions.runFunc(() => {
        this.readyToMove = true;
        this.pumpQueuedMove();
      })
    ).play();
  }

  resizeAgain() {
    this.resize(this.prevWidth, this.prevHeight);
  }

  resize(width: number, height: number) {
    if (!this.parent) return;
    this.prevWidth = width;
    this.prevHeight = height;

    this.darkOverlay.width = Game.instance.width / Game.instance.scale;
    this.darkOverlay.height = Game.instance.height / Game.instance.scale;
    this.darkOverlay.position.set(
      -this.parent.position.x / Game.instance.scale,
      -this.parent.position.y / Game.instance.scale
    );

    // Dungeon grid position
    let dungeonY = (height - this.dungeonGrid.edgeSize) / 2;
    let dungeonX = (width - this.dungeonGrid.edgeSize) / 2;

    // Grids
    // Move it
    this.dungeonGrid.position.set(dungeonX, dungeonY);
    this.scoreLabel.position.set(dungeonX + this.dungeonGrid.edgeSize / 2, 16);

    // Modals
    const modals = [this.gameOverModal];
    for (const m of modals) {
      if (m) {
        // Centre it!
        const x = (width - Game.TARGET_WIDTH) / 2;
        const y = (height - Game.TARGET_HEIGHT) / 2;
        m.position.set(x, y);
      }
    }
  }

  keydown(code: string) {
    let dx = 0;
    let dy = 0;
    if (code == "ArrowLeft" || code == "KeyA") {
      dx = -1;
    } else if (code == "ArrowRight" || code == "KeyD") {
      dx = 1;
    } else if (code == "ArrowUp" || code == "KeyW") {
      dy = -1;
    } else if (code == "ArrowDown" || code == "KeyS") {
      dy = 1;
    }
    if (dx != 0 || dy != 0) {
      // Attempted move
      this.doMove(dx, dy);
    }
  }
}