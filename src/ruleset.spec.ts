import { Ruleset } from './ruleset';
import { Rule } from './rule';
import { Configuration } from './configuration';

test("configurations computed right", () => {
  let validRuleset = new Ruleset(new Set([
    new Rule(1, [1, 2, 3]),
    new Rule(2, [2, 3, 4])
  ]));
  expect(validRuleset.computeConfigurations()).toEqual([
    new Configuration(
      [
        new Configuration([], new Map([[2, 0], [3, 1], [4, 1]])),
        new Configuration([], new Map([[2, 1], [3, 0], [4, 1]]))
      ],
      new Map([[1, 0]])
    )
  ]);

  let invalidRuleset = new Ruleset(new Set([
    new Rule(1, [1, 2, 3]),
    new Rule(3, [2, 3, 4])
  ]));
  expect(invalidRuleset.computeConfigurations()).toBe("invalid");
});

test("setting cell value returns right ruleset and value map", () => {
  let ruleset = new Ruleset(new Set([
    new Rule(1, [1, 2, 3]),
    new Rule(2, [2, 3, 4])
  ]));
  expect(ruleset.setCellValue(1, 1)).toEqual(["invalid"]);
  let [newRuleset, fixedCellValues] = ruleset.setCellValue(2, 0);
  expect(newRuleset).toEqual(new Ruleset(new Set()));
  expect(fixedCellValues).toEqual(new Map([[1, 0], [2, 0], [3, 1], [4, 1]]));
});

test("updating rules", () => {
  let ruleset = new Ruleset(new Set([
    new Rule(1, [1, 2, 3]),
    new Rule(2, [2, 3, 4])
  ]));
  expect((<Ruleset>ruleset.updateRules(1, 1)).updateRules(2, 1)).toEqual("invalid");
  expect(ruleset.updateRules(2,1)).toEqual(new Ruleset(new Set([
    new Rule(0, [1, 3]),
    new Rule(1, [3, 4])
  ])));
});

test("getting cell values from solved rules", () => {
  let ruleset = new Ruleset(new Set([
    new Rule(1, [1]),
    new Rule(0, [2, 3])
  ]));
  expect(ruleset.getCellValuesFromSolvedRules()).toEqual(new Map([
    [1, 1],
    [2, 0],
    [3, 0]
  ]));

  let invalidRuleset = new Ruleset(new Set([
    new Rule(1, [1]),
    new Rule(0, [1])
  ]));
  expect(invalidRuleset.getCellValuesFromSolvedRules()).toEqual("invalid");
});
