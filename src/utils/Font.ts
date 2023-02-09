import * as PIXI from "pixi.js";

type FontSize = "small" | "medium" | "large";

export default class Font {
  static fonts = {
    Kaph: {
      baseSize: 24,
      license: "https://opensource.org/licenses/OFL-1.1",
    },
  };
  static makeFontOptions(
    size: FontSize,
    align: PIXI.TextStyleAlign = "center",
    face: "Kaph" = "Kaph"
  ) {
    const font = this.fonts[face];
    return {
      fontName: face,
      fontSize: this.multiplier(size) * font.baseSize,
      align,
    };
  }
  static multiplier(size: FontSize): number {
    if (size === "small") return 0.5;
    if (size === "medium") return 1;
    if (size === "large") return 1.5;
    else return 1;
  }
}
