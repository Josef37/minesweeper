// handy utilities
class Utils {
  // modern Fisher–Yates shuffle
  static shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // convert coordinates to x-first index (x-first = x is counted up first)
  static getIndex(x: number, y: number, gridWidth: number) {
    return x + y * gridWidth;
  }

  // convert x-first index to coordinates (x-first = x is counted up first)
  static getCoordinates(index: number, gridWidth: number): [number, number] {
    let x = index % gridWidth,
      y = Math.floor(index / gridWidth);
    return [x, y];
  }

  // binomial coefficient "n choose k"
  static choose(n: number, k: number) {
    if (k < 0) return 0;
    if (k === 0) return 1;
    return n / k * Utils.choose(n - 1, k - 1);
  }

  // calculate choose(n,k) / choose(n, minimalK)
  static reducedBinomial(n: number, k: number, minimalK: number) {
    if (k < 0) return 0;
    let result = 1;
    for (let i = 0; i < k - minimalK; i++) {
      result *= (n - minimalK - i) / (k - i);
    }
    return result;
  }
}

// map from keys to multiple values
class Multimap {
  map: Map<any, Set<any>>;

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

  delete(key: any, value = null) {
    if (!this.map.has(key)) {
      return false;
    }
    if (typeof value == null) {
      return this.map.delete(key);
    } else {
      let values = this.map.get(key);
      if (values.size == 1 && values.has(value)) {
        return this.map.delete(key);
      } else {
        return values.delete(value);
      }
    }
  }

  keys() {
    return this.map.keys();
  }
}
