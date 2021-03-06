import { Rule } from './rule';

test("Test validity detection", () => {
  let rule = new Rule(0, []);
  expect(rule.isValid()).toBe(true);
  rule = new Rule(-1, []);
  expect(rule.isValid()).toBe(false);
  rule = new Rule(2, [1,2]);
  expect(rule.isValid()).toBe(true);
  rule = new Rule(2, [1]);
  expect(rule.isValid()).toBe(false);
});

test("Test waste detection", () => {
  let rule = new Rule(0, []);
  expect(rule.isWaste()).toBe(true);
});

test("Modifying cell not in rule doesn't affect rule", () => {
  let rule = new Rule(0, [1,2]);
  expect(rule.updateRule(3, 1)).toEqual(rule);
});

test("Modifying cell in rule deletes cell and reduces count by value", () => {
  let rule = new Rule(1, [1,2]);
  expect(rule.updateRule(2, 1)).toEqual(new Rule(0, [1]));
});
