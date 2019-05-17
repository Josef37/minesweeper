class Utils {
  static shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
  }
}

class Multimap {
  constructor() {
    this.map = new Map();
  }

  set(key, value) {
    if(this.map.has(key)) {
      this.map.get(key).add(value);
    } else {
      this.map.set(key, new Set([value]));
    }
  }

  get(key) {
    return this.map.get(key);
  }

  delete(key, value) {
    if(typeof value === "undefined") {
      this.map.delete(key);
    } else {
      this.map.get(key).delete(value);
    }
  }
}
