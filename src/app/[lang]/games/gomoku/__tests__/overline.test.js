import { checkOverline, findXPositionAndReplace } from '../move';

describe('Gomoku Overline', () => {
  const testCases = [
    {
      name: "Overline (Horizontal)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "B", "B", "B", "B", "X", "B", "", "", "", "", "", "", ""],
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
      expected: [[[6,2], [6,3], [6,4], [6,5], [6,6], [6,7]]]
    },
    {
      name: "Overline (Vertical)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
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
      expected: [[[1,4], [2,4], [3,4], [4,4], [5,4], [6,4]]]
    },
    {
      name: "Overline (Diagonal Right)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "B", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "B", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "B", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "X", "", "", "", "", "", "", "", "", ""],
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
      expected: [[[2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6]]]
    },
    {
      name: "Overline (Diagonal Left)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "B", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "B", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "B", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "B", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "X", "", "", "", "", "", ""],
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
      expected: [[[7, 7], [6, 8], [5, 9], [4, 10], [3, 11], [2, 12]]]
    },
    {
      name: "Multiple Overlines",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "B", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "B", "X", "B", "B", "B", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "B", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      expected: [
        [[4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8]], 
        [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8]]
      ]
    }
  ];


  testCases.forEach(testCase => {
    test(testCase.name, () => {
      const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
      const result = checkOverline(updatedBoard, row, col, testCase.player);
      expect(result).toEqual(expect.arrayContaining(testCase.expected));
      expect(result.length).toBe(testCase.expected.length);
    });
  });
});

describe('Gomoku checkOverline - Not Overline', () => {
  const testCases = [
    {
      name: "Not Overline (Exactly 5 in a row - Horizontal)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "B", "B", "B", "B", "X", "", "", "", "", "", "", "", ""],
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
      expected: []
    },
    {
      name: "Not Overline (Less than 5 in a row - Vertical)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
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
      expected: []
    },
    {
        name: "Not Overline (Exactly 5 in a row - Horizontal)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "B", "B", "B", "B", "X", "", "", "", "", "", "", "", ""],
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
        expected: []
      },
      {
        name: "Not Overline (Less than 5 in a row - Vertical)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
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
        expected: []
      },
      {
        name: "Not Overline (Blocked by opponent - Diagonal Right)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "B", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "B", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "W", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "X", "", "", "", "", "", "", "", ""],
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
        expected: []
      },
      {
        name: "Not Overline (Discontinuous - Diagonal Left)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "B", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "B", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "B", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "B", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "X", "", "", "", "", "", "", ""],
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
        expected: []
      },
      {
        name: "Not Overline (Edge of board - Horizontal)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["B", "B", "B", "B", "X", "", "", "", "", "", "", "", "", "", ""]
        ],
        player: "B",
        expected: []
      }
  ];

  testCases.forEach(testCase => {
    test(testCase.name, () => {
      const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
      const result = checkOverline(updatedBoard, row, col, testCase.player);
      expect(result).toEqual(testCase.expected);
    });
  });
});