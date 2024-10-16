import { checkDoubleThree, findXPositionAndReplace, checkDoubleFours } from '../move';

describe('Gomoku checkDoubleThree isThreeThree', () => {
  const testCases = [
    {
      name: "Double continuous open threes",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "X", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: true,
        forbiddenPositions: [ [ 6, 5 ], [ 6, 6 ], [ 6, 7 ], [ 5, 6 ], [ 7, 6 ] ] ,
        openThreesCount: 2
      }
    },
    {
      name: "Double open threes with four",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "B", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "X", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "B", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["B", "", "B", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: true,
        forbiddenPositions: [ [ 10, 2 ], [ 11, 2 ], [ 12, 2 ], [ 9, 3 ], [ 8, 4 ] ],
        openThreesCount: 2
      }
    },
    {
      name: "Two jump threes",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "X", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "B", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: true,
        forbiddenPositions: [[ 6, 6 ], [ 8, 8 ], [ 9, 9 ], [ 7, 5 ], [ 4, 8 ]],
        openThreesCount: 2
      }
    },
    {
      name: "Three open threes",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "X", "B", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: true,
        forbiddenPositions: [
          [ 5, 5 ], [ 5, 6 ],
          [ 5, 7 ], [ 7, 5 ],
          [ 8, 5 ], [ 6, 6 ],
          [ 8, 8 ]
        ],
        openThreesCount: 3
      }
    }
  ];

  testCases.forEach(testCase => {
    test(testCase.name, () => {
      const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
      const result = checkDoubleThree(updatedBoard, row, col, testCase.player);
      
      expect(result.isForbidden).toBe(testCase.expectedResult.isForbidden);
      expect(result.forbiddenPositions).toEqual(testCase.expectedResult.forbiddenPositions);
      expect(result.openThrees.length).toBe(testCase.expectedResult.openThreesCount);
    });
  });
});

describe('Gomoku checkDoubleThree not ThreeThree', () => {
  const testCases = [
    {
      name: "Single three by player",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "B", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "X", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: false,
        forbiddenPositions: [],
        openThreesCount: 1
      }
    },
    {
      name: "Closed three and three",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
        ["", "", "", "", "", "", "W", "B", "B", "X", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: false,
        forbiddenPositions: [],
        openThreesCount: 0
      }
    },
    {
      name: "Open three and four",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "X", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: false,
        forbiddenPositions: [],
        openThreesCount: 1
      }
    },
    {
      name: "Open three and five",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "B", "X", "B", "B", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isForbidden: false,
        forbiddenPositions: [],
        openThreesCount: 0
      }
    }
  ];

  testCases.forEach(testCase => {
    test(testCase.name, () => {
      const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
      const result = checkDoubleThree(updatedBoard, row, col, testCase.player);
      
      expect(result.isForbidden).toBe(testCase.expectedResult.isForbidden);
      expect(result.forbiddenPositions).toEqual(testCase.expectedResult.forbiddenPositions);
      expect(result.openThrees.length).toBe(testCase.expectedResult.openThreesCount);
    });
  });
});

describe('Gomoku checkDoubleFours isFourFour', () => {
  const testCases = [
    {
      name: "Double live fours",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "B", "X", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "B", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isDoubleFour: true,
        forbiddenPositions: [[5, 5], [5, 6], [5, 7], [5, 8], [4, 6], [6, 8], [7, 9]]
      }
    },
    {
      name: "Rush four and live four",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "W", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "B", "B", "X", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expectedResult: {
        isDoubleFour: true,
        forbiddenPositions: [[4, 7], [5, 7], [6, 7], [7, 7], [5, 4], [5, 5], [5, 6]],
      }
    },
    {
        name: "Rush four(without obstacles) and live four ",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "B", "B", "X", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[3, 7], [5, 7], [6, 7], [7, 7], [5, 4], [5, 5], [5, 6]],
        }
      },
    {
        name: "Double Rush fours",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "B", "B", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "X", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "B", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "B", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["B", "", "", "B", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[3, 3], [4, 3], [5, 3], [7, 3], [3, 4], [6, 1], [7, 0]],
        }
      },
      {
        name: "Three fours",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "B", "X", "", "B", "B"],
          ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "B", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "B", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[6, 10], [6, 11], [6, 13], [6, 14], [3, 11], [4, 11], [5, 11], [7, 10], [8, 9], [9, 8]],
        }
      },
      {
        name: "Two rush fours and three",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "", "", "B", "", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "X", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "B", "", "B", "", "B", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "B", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[4, 9], [5, 10], [7, 12], [8, 13], [3, 12], [4, 11], [7, 8]],
        }
      },
      {
        name: "Two rush fours in a row - 1",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "", "B", "X", "B", "", "B", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[6, 4], [6, 6], [6, 7], [6, 8], [6, 10]]
        }
      },
      {
        name: "Two rush fours in a row - 2",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "", "B", "B", "X", "", "B", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[6, 4], [6, 6], [6, 7], [6, 8], [6, 10]]
        }
      },
      {
        name: "Two rush fours in a row - 3",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "B", "", "B", "X", "", "B", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[6, 4], [6, 5], [6, 7], [6, 8], [6, 10], [6, 11]]
        }
      },
      {
        name: "Two rush fours in a row - 4",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "B", "B", "B", "", "X", "", "B", "B", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expectedResult: {
          isDoubleFour: true,
          forbiddenPositions: [[6, 3], [6, 4], [6, 5], [6, 7], [6, 9], [6, 10], [6, 11]]
        }
      },
  ];

  testCases.forEach(testCase => {
    test(testCase.name, () => {
      const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
      const result = checkDoubleFours(updatedBoard, row, col, testCase.player);
      
      expect(result.isDoubleFour).toBe(testCase.expectedResult.isDoubleFour);
      expect(result.forbiddenPositions).toEqual(expect.arrayContaining(testCase.expectedResult.forbiddenPositions));
      expect(result.forbiddenPositions.length).toBe(testCase.expectedResult.forbiddenPositions.length);
    });
  });
});
