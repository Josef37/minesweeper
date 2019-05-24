import { Utils, Multimap } from './utils'

describe("testing Utils", () => {
  test("shuffle array with same seed produces same result", () => {
    let array = [1, 2, 3, 4, 5];
    Utils.shuffle(array, 1);
    expect(array).toEqual([1, 2, 5, 4, 3]);
  });

  test("shuffle array with same seed produces same result", () => {
    let array1 = [1, 2, 3, 4, 5];
    let array2 = [1, 2, 3, 4, 5];
    for (let seed = 0; seed < 10; seed++) {
      Utils.shuffle(array1, seed);
      Utils.shuffle(array2, seed);
      expect(array1).toEqual(array2);
    }
  });

  test("getting index from coordinates depends on grid width", () => {
    expect(Utils.getIndex(0, 0, 10)).toBe(0);
    expect(Utils.getIndex(0, 1, 10)).toBe(10);
    expect(Utils.getIndex(0, 1, 5)).toBe(5);
    expect(Utils.getIndex(2, 1, 5)).toBe(7);
  });

  test("getting coordinates from index depends on grid width", () => {
    expect(Utils.getCoordinates(0, 10)).toEqual([0, 0]);
    expect(Utils.getCoordinates(10, 10)).toEqual([0, 1]);
    expect(Utils.getCoordinates(5, 5)).toEqual([0, 1]);
    expect(Utils.getCoordinates(7, 5)).toEqual([2, 1]);
  });

  test("binomial coefficient", () => {
    expect(Utils.choose(5, -1)).toBe(0);
    expect(Utils.choose(5, 0)).toBe(1);
    expect(Utils.choose(5, 1)).toBe(5);
    expect(Utils.choose(5, 2)).toBe(10);
    expect(Utils.choose(5, 6)).toBe(0);
  });

  test("reducedBinomial should keep ratio of binomial", () => {
    for (let [n, k1, k2, kMin] of [[10, 8, 4, 3], [50, 40, 25, 20], [50, 45, 40, 25]]) {
      let ratioOriginal = Utils.choose(n, k1) / Utils.choose(n, k2);
      let ratioReduced = Utils.reducedBinomial(n, k1, kMin) / Utils.reducedBinomial(n, k2, kMin);
      expect(ratioOriginal).toBeCloseTo(ratioReduced);
    }
  });
});

describe("Testing Multimap", () => {
  test("Setting same key and value results in only one element", () => {
    let map = new Multimap();
    map.set(1, 2);
    map.set(1, 2);
    expect(map.get(1).size).toBe(1);
  });

  test("Getting an non existent key gives back undefined", () => {
    let map = new Multimap();
    expect(map.get(1)).toBe(undefined);
  });

  test("Removing the last value removes the key", () => {
    let map = new Multimap();
    map.set(1, 2);
    map.set(1, 3);
    expect(map.delete(1, 4)).toBe(false);
    expect(map.delete(2)).toBe(false);
    map.delete(1, 3);
    expect(map.get(1).size).toBe(1);
    map.delete(1,2);
    expect(map.get(1)).toBe(undefined);
  });

  test("Getting keys returns every key just once", () => {
    let map = new Multimap();
    map.set(1, 3);
    map.set(1, 4);
    map.set(2, 5);
    expect(Array.from(map.keys())).toEqual([1,2]);
  });
});
