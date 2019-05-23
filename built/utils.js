// handy utilities
class Utils {
    // modern Fisher–Yates shuffle (in-place)
    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    // convert coordinates to x-first index (x-first = x is counted up first)
    static getIndex(x, y, gridWidth) {
        return x + y * gridWidth;
    }
    // convert x-first index to coordinates (x-first = x is counted up first)
    static getCoordinates(index, gridWidth) {
        let x = index % gridWidth, y = Math.floor(index / gridWidth);
        return [x, y];
    }
    // binomial coefficient "n choose k"
    static choose(n, k) {
        if (k < 0)
            return 0;
        if (k === 0)
            return 1;
        return n / k * Utils.choose(n - 1, k - 1);
    }
    // calculate choose(n,k) / choose(n, minimalK)
    static reducedBinomial(n, k, minimalK) {
        if (k < 0)
            return 0;
        let result = 1;
        for (let i = 0; i < k - minimalK; i++) {
            result *= (n - minimalK - i) / (k - i);
        }
        return result;
    }
}
// map from keys to multiple values
class Multimap {
    constructor() {
        this.map = new Map();
    }
    set(key, value) {
        if (this.map.has(key)) {
            this.map.get(key).add(value);
        }
        else {
            this.map.set(key, new Set([value]));
        }
    }
    get(key) {
        return this.map.get(key);
    }
    delete(key, value = null) {
        if (!this.map.has(key)) {
            return false;
        }
        if (typeof value == null) {
            return this.map.delete(key);
        }
        else {
            let values = this.map.get(key);
            if (values.size == 1 && values.has(value)) {
                return this.map.delete(key);
            }
            else {
                return values.delete(value);
            }
        }
    }
    keys() {
        return this.map.keys();
    }
}
