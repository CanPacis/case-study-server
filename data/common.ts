export const descriptor = {
  False: 0,
  True: 1,
  String: 2,
  Number: 3,
  Array: 4,
  Object: 5,
  Null: 6,
} as const;

export const descriptorMap = {
  0: "False",
  1: "True",
  2: "String",
  3: "Number",
  4: "Array",
  5: "Object",
  6: "Null",
} as const;
