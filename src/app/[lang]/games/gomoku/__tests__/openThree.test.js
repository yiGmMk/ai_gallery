import { isOpenThree, directions, ThreeType } from '../forbiddenMoves';

const directionMap = {
  horizontal: directions[0],
  vertical: directions[1],
  diagonalRight: directions[2],
  diagonalLeft: directions[3]
};

function findXPositionAndReplace(board, player) {
  const newBoard = board.map(row => [...row]);
  for (let i = 0; i < newBoard.length; i++) {
    for (let j = 0; j < newBoard[i].length; j++) {
      if (newBoard[i][j] === 'X') {
        newBoard[i][j] = player;
        return { position: [i, j], board: newBoard };
      }
    }
  }
  throw new Error('No "X" found in the board');
}

describe('Gomoku isOpenThree - Continuous Open Three', () => {
  const testCases = [
    {
      name: "Continuous Open Three (Horizontal - Left)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "X", "B", "B", "", "", "", "", "", "", "", "", "", ""],
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
      direction: "horizontal",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[6,1],[6,2], [6,3], [6,4], [6,5]]
      }
    },
    {
      name: "Continuous Open Three (Horizontal - Middle)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "B", "X", "B", "", "", "", "", "", "", "", "", ""],
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
      direction: "horizontal",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[6,2], [6,3], [6,4], [6,5], [6,6]]
      }
    },
    {
      name: "Continuous Open Three (Horizontal - Right)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "B", "X", "", "", "", "", "", "", "", ""],
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
      direction: "horizontal",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[6,3], [6,4], [6,5], [6,6], [6,7]]
      }
    },
    {
      name: "Continuous Open Three (Vertical - Top)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
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
      direction: "vertical",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[3,4], [4,4], [5,4], [6,4], [7,4]]
      }
    },
    {
      name: "Continuous Open Three (Vertical - Middle)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
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
      direction: "vertical",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[3,4], [4,4], [5,4], [6,4], [7,4]]
      }
    },
    {
      name: "Continuous Open Three (Vertical - Bottom)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      direction: "vertical",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[4,4], [5,4], [6,4], [7,4], [8,4]]
      }
    },
    {
      name: "Continuous Open Three (Diagonal Right - Top)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
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
      direction: "diagonalRight",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[2,3], [3,4], [4,5], [5,6], [6,7]]
      }
    },
    {
      name: "Continuous Open Three (Diagonal Right - Middle)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "X", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
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
      direction: "diagonalRight",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[2,3], [3,4], [4,5], [5,6], [6,7]]
      }
    },
    {
      name: "Continuous Open Three (Diagonal Right - Bottom)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
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
      direction: "diagonalRight",
      expected: {
        isOpen: true,
        type: ThreeType.CONTINUOUS,
        positions: [[3, 3], [4, 4], [5, 5], [6, 6], [7, 7]]
      }
    },
    {
      name: "Continuous Open Three (Diagonal Left - Top)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "X", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
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
        direction: "diagonalLeft",
        expected: {
          isOpen: true,
          type: ThreeType.CONTINUOUS,
          positions: [[2,8], [3,7], [4,6], [5,5], [6,4]]
        }
      },
      {
        name: "Continuous Open Three (Diagonal Left - Middle)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "X", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
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
        direction: "diagonalLeft",
        expected: {
          isOpen: true,
          type: ThreeType.CONTINUOUS,
          positions: [[2,8], [3,7], [4,6], [5,5], [6,4]]
        }
      },
      {
        name: "Continuous Open Three (Diagonal Left - Bottom)",
        board: [
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "X", "", "", "", "", "", "", "", "", ""],
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
        direction: "diagonalLeft",
        expected: {
          isOpen: true,
          type: ThreeType.CONTINUOUS,
          positions: [[7, 4], [6, 5], [5, 6], [4, 7], [3, 8]]
        }
      },
    ];
  
    testCases.forEach(testCase => {
      test(testCase.name, () => {
        const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
        const [dx, dy] = directionMap[testCase.direction];
        const result = isOpenThree(updatedBoard, row, col, dx, dy, testCase.player);
        expect(result.isOpen).toBe(testCase.expected.isOpen);
        expect(result.type).toBe(testCase.expected.type);
        expect(result.positions).toEqual(expect.arrayContaining(testCase.expected.positions));
        expect(result.positions.length).toBe(testCase.expected.positions.length);
      });
    });
});

describe('Gomoku isOpenThree - Not Continuous Open Three', () => {
  const testCases = [
    {
      name: "Not Open Three (Blocked on one side - Horizontal)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "W", "B", "B", "X", "", "", "", "", "", "", "", "", ""],
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
      direction: "horizontal",
      expected: {
        isOpen: false
      }
    },
    {
      name: "Not Open Three (Blocked on both sides - Vertical)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "W", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "X", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "W", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
      ],
      player: "B",
      direction: "vertical",
      expected: {
        isOpen: false
      }
    },
    {
      name: "Not Open Three (Only two in a row - Diagonal Right)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "B", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "X", "", "", "", "", "", "", "", "", ""],
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
      direction: "diagonalRight",
      expected: {
        isOpen: false
      }
    },
    {
      name: "Not Open Three (Four in a row - Diagonal Left)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "B", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "B", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "B", "", "", "", "", "", "", "", "", ""],
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
      direction: "diagonalLeft",
      expected: {
        isOpen: false
      }
    },
    {
      name: "Not Open Three (Gap too large - Horizontal)",
      board: [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "B", "", "X", "B", "", "", "", "", "", "", "", "", ""],
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
      direction: "horizontal",
      expected: {
        isOpen: false
      }
    }
  ];

  testCases.forEach(testCase => {
    test(testCase.name, () => {
      const { position: [row, col], board: updatedBoard } = findXPositionAndReplace(testCase.board, testCase.player);
      const [dx, dy] = directionMap[testCase.direction];
      const result = isOpenThree(updatedBoard, row, col, dx, dy, testCase.player);
      expect(result.isOpen).toBe(testCase.expected.isOpen);
    });
  });
});