import * as PIXI from "pixi.js";
import { Sound, sound } from "@pixi/sound";
import { Actions } from "pixi-actions";

import { Screen, GameScreen, MenuScreen } from "screens";
import { Font } from "utils";

import * as _ from "underscore";

export default class Game {
  // Display options
  static TARGET_WIDTH = 225;
  static TARGET_HEIGHT = 345;
  static INTEGER_SCALING = false;
  static MAINTAIN_RATIO = false;

  // Game options
  static EXIT_TYPE: "stairs" | "door" = "stairs";
  static DIMENSION = 5;

  // Debug stuff
  static DEBUG_SHOW_FRAMERATE = true;

  // Helpers
  static instance: Game;

  resources: any;
  spritesheet: PIXI.Spritesheet;
  app: PIXI.Application;
  stage: PIXI.Container;
  fpsLabel: PIXI.BitmapText;
  backgroundSprite: PIXI.Sprite;
  innerBackgroundSprite: PIXI.Sprite;

  width: number = window.innerWidth;
  height: number = window.innerHeight;
  scale: number = 1;

  currentScreen: Screen;

  startTouch: { x: number; y: number };
  startTouchTime: number;

  playerHash: string;
  playerName: string;

  muted: boolean;
  stretchDisplay: boolean;

  fpsAverageShort: number[] = [];
  fpsAverageLong: number[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;

    this.muted = false;
    this.stretchDisplay = !Game.INTEGER_SCALING;

    this.stage = new PIXI.Container();
    this.app.stage.addChild(this.stage);

    this.resize(this.app.renderer.width, this.app.renderer.height);

    this.init();
  }

  setStretchDisplay(s: boolean) {
    this.stretchDisplay = s;
    this.resize(this.width, this.height);
  }

  static tex(name: string): PIXI.Texture {
    return Game.instance.spritesheet.textures[name];
  }

  init() {
    sound.init();
    Game.instance = this;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
    PIXI.settings.ROUND_PIXELS = false;

    PIXI.Loader.shared
      .add("spritesheet", "packed.json")
      .add("Kaph", "font/kaph.fnt")
      .add("sound-attack", "sound/attack.wav")
      .add("sound-bump", "sound/bump.wav")
      .add("sound-step1", "sound/step1.wav")
      .add("sound-step2", "sound/step2.wav")
      .add("sound-step3", "sound/step3.wav")
      .add("sound-step4", "sound/step4.wav")
      .use((resource, next) => {
        // Load sounds into sound system
        if (resource) {
          if (["wav", "ogg", "mp3", "mpeg"].includes(resource.extension)) {
            sound.add(resource.name, Sound.from(resource.data));
          }
        }
        next();
      })
      .load((_, resources) => {
        this.resources = resources;
        this.spritesheet = this.resources["spritesheet"].spritesheet;
        this.postInit();
      });
  }

  gotoGameScreen() {
    this.setScreen(new GameScreen());
  }

  gotoMenuScreen() {
    this.setScreen(new MenuScreen());
  }

  setScreen(screen: Screen) {
    if (this.currentScreen != null) {
      // Remove it!
      Actions.fadeOutAndRemove(this.currentScreen, 0.2).play();
    }
    // Add new one
    screen.alpha = 0;
    Actions.fadeIn(screen, 0.2).play();
    this.currentScreen = screen;
    this.stage.addChild(screen);
    this.notifyScreensOfSize();
  }

  postInit() {
    // FPS label
    this.fpsLabel = new PIXI.BitmapText(
      "0",
      Font.makeFontOptions("medium", "left")
    );
    this.fpsLabel.anchor.set(0);
    this.fpsLabel.position.set(10, 10);
    this.fpsLabel.tint = 0xffffff;
    if (Game.DEBUG_SHOW_FRAMERATE) {
      this.app.stage.addChild(this.fpsLabel);
    }

    // Add background
    this.backgroundSprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.backgroundSprite.tint = 0xffffff;
    this.backgroundSprite.width = this.width;
    this.backgroundSprite.height = this.height;
    this.app.stage.addChildAt(this.backgroundSprite, 0);

    // Inner background
    this.innerBackgroundSprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.innerBackgroundSprite.tint = 0x333333;
    this.innerBackgroundSprite.width = Game.TARGET_WIDTH;
    this.innerBackgroundSprite.height = Game.TARGET_HEIGHT;
    this.stage.addChild(this.innerBackgroundSprite);

    this.gotoMenuScreen();

    this.resize(window.innerWidth, window.innerHeight);
    this.notifyScreensOfSize();

    // Register swipe listeners
    // EventEmitter types issue - see https://github.com/pixijs/pixijs/issues/7429
    const stage = this.backgroundSprite as any;
    stage.interactive = true;
    stage.on("pointerdown", (e: any) => {
      this.startTouch = { x: e.data.global.x, y: e.data.global.y };
      this.startTouchTime = new Date().getTime();
    });
    stage.on("pointerup", (e: any) => {
      if (!this.startTouch) return;
      const deltaTime = new Date().getTime() - this.startTouchTime;
      const deltaX = e.data.global.x - this.startTouch.x;
      const deltaY = e.data.global.y - this.startTouch.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const absMin = Math.min(absDeltaX, absDeltaY);
      const absMax = Math.max(absDeltaX, absDeltaY);
      // One axis must be above this to trigger a swipe
      const triggerThreshold = 10;
      // The other axis must be smaller than this to avoid a diagonal swipe
      const confusionThreshold = absMax / 2;
      const maxTimeMs = 500; //ms
      if (deltaTime < maxTimeMs) {
        if (absMin < confusionThreshold) {
          if (absMax > 10) {
            if (absMax == absDeltaX) {
              // Right or left
              this.keydown(deltaX > 0 ? "KeyD" : "KeyA");
            } else {
              // Up or down
              this.keydown(deltaY > 0 ? "KeyS" : "KeyW");
            }
          }
        }
      }
    });

    this.app.ticker.add((delta: number) => this.tick(delta));
  }

  playSound(name: string | string[]) {
    if (this.muted) return;
    const theName = Array.isArray(name) ? _.sample(name) : name;
    const resource = this.resources["sound-" + theName];
    if (resource?.sound) {
      resource.sound.play();
    }
  }

  tick(delta: number) {
    // delta is in frames
    let elapsedSeconds = delta / 60;

    Actions.tick(elapsedSeconds);

    this.fpsAverageShort.push(this.app.ticker.FPS);
    this.fpsAverageLong.push(this.app.ticker.FPS);

    // Keep most recent only
    if (this.fpsAverageShort.length > 100) {
      this.fpsAverageShort.shift();
    }
    if (this.fpsAverageLong.length > 1000) {
      this.fpsAverageLong.shift();
    }

    const avgShort =
      _.reduce(this.fpsAverageShort, (a, b) => a + b, 0) /
      (this.fpsAverageShort.length === 0 ? 1 : this.fpsAverageShort.length);
    const avgLong =
      _.reduce(this.fpsAverageLong, (a, b) => a + b, 0) /
      (this.fpsAverageLong.length === 0 ? 1 : this.fpsAverageLong.length);
    this.fpsLabel.text =
      "" +
      Math.round(this.app.ticker.FPS) +
      "\n" +
      Math.round(avgShort) +
      "\n" +
      Math.round(avgLong) +
      "\n";
  }

  notifyScreensOfSize() {
    // Let screens now
    for (const s of this.stage.children) {
      if (s instanceof Screen) {
        if (Game.MAINTAIN_RATIO) {
          s.resize(Game.TARGET_WIDTH, Game.TARGET_HEIGHT);
        } else {
          s.resize(this.width / this.scale, this.height / this.scale);
        }
      }
    }
  }

  resize(width: number, height: number) {
    //this part resizes the canvas but keeps ratio the same
    this.app.renderer.view.style.width = width + "px";
    this.app.renderer.view.style.height = height + "px";

    this.width = width;
    this.height = height;

    if (this.backgroundSprite) {
      this.backgroundSprite.width = width;
      this.backgroundSprite.height = height;
    }

    if (this.innerBackgroundSprite) {
      if (Game.MAINTAIN_RATIO) {
        this.innerBackgroundSprite.width = Game.TARGET_WIDTH;
        this.innerBackgroundSprite.height = Game.TARGET_HEIGHT;
      } else {
        this.innerBackgroundSprite.width = width;
        this.innerBackgroundSprite.height = height;
      }
    }

    this.app.renderer.resize(width, height);

    // Ensure stage can fit inside the view!
    // Scale it if it's not snug
    const targetScaleX = width / Game.TARGET_WIDTH;
    const targetScaleY = height / Game.TARGET_HEIGHT;
    const smoothScaling = Math.min(targetScaleX, targetScaleY);
    // Pick integer scale which best fits
    this.scale = !this.stretchDisplay
      ? Math.max(1, Math.floor(smoothScaling))
      : smoothScaling;
    this.stage.scale.set(this.scale, this.scale);

    // Centre stage
    if (Game.MAINTAIN_RATIO) {
      this.stage.position.set(
        (width - Game.TARGET_WIDTH * this.scale) / 2,
        (height - Game.TARGET_HEIGHT * this.scale) / 2
      );
    } else {
      this.stage.position.set(0, 0);
    }

    this.notifyScreensOfSize();
  }

  keydown(code: string) {
    if (this.currentScreen) this.currentScreen.keydown(code);
  }
}
