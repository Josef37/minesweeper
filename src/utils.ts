class Utils {
  static shuffle(a: any[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  static getIndex(x: number, y: number, width: number) {
    return x + y * width;
  }

  static getCoordinates(index: number, width: number): [number, number] {
    let x = index % width,
      y = Math.floor(index / width);
    return [x, y];
  }

  // TODO replace https://stackoverflow.com/questions/37679987/efficient-computation-of-n-choose-k-in-node-js
  static choose(n: number, k: number) {
    if (k < 0) return 0;
    if (k === 0) return 1;
    return (n * Utils.choose(n - 1, k - 1)) / k;
  }
}

class Multimap {
  map: Map<any, any>;

  constructor() {
    this.map = new Map();
  }

  set(key: any, value: any) {
    if (this.map.has(key)) {
      this.map.get(key).add(value);
    } else {
      this.map.set(key, new Set([value]));
    }
  }

  get(key: any) {
    return this.map.get(key);
  }

  delete(key: any, value: any) {
    if (!this.map.has(key)) {
      return false;
    }
    if (typeof value === "undefined") {
      return this.map.delete(key);
    } else {
      if (this.map.get(key).size == 1) {
        return this.map.delete(key);
      } else {
        return this.map.get(key).delete(value);
      }
    }
  }

  keys() {
    return this.map.keys();
  }
}
