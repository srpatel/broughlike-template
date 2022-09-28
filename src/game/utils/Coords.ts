export default class Coords {
  col: number;
  row: number;
  constructor(col: number, row: number) {
    this.col = col;
    this.row = row;
  }
  add(dx: number, dy: number) {
    this.col += dx;
    this.row += dy;
    return this;
  }
  set(col: number | Coords, row: number = null) {
    if (typeof col == "number") {
      this.col = col;
      this.row = row;
    } else {
      this.col = col.col;
      this.row = col.row;
    }
    return this;
  }
  clone(): Coords {
    return new Coords(this.col, this.row);
  }
  equals(col: number | Coords, row: number = null) {
    let c = 0;
    let r = 0;
    if (typeof col == "number") {
      c = col;
      r = row;
    } else {
      c = col.col;
      r = col.row;
    }
    return this.col == c && this.row == r;
  }
}
