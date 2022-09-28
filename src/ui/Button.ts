import * as PIXI from "pixi.js";
import { Font } from "utils";

export default class Button extends PIXI.Container {
  label: PIXI.BitmapText;
  onclick: () => void;
  constructor(text: string, onclick: () => void) {
    super();

    this.onclick = onclick;

    // Make a label!
    const theLabel = new PIXI.BitmapText(text, Font.makeFontOptions("small"));
    theLabel.tint = 0;
    theLabel.anchor.set(0.5);
    theLabel.position.x = 0;
    theLabel.position.y = 0;
    this.label = theLabel;

    // Background
    const holderBackground = PIXI.Sprite.from(PIXI.Texture.WHITE);
    holderBackground.width = 200;
    holderBackground.height = 25;
    holderBackground.position.set(
      -holderBackground.width / 2,
      -holderBackground.height / 2
    );

    this.addChild(holderBackground);
    this.addChild(theLabel);

    const ee = this as any;
    ee.interactive = true;
    ee.on("pointertap", () => {
      this.onclick();
    });
  }
}
