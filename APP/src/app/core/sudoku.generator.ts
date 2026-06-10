export class SudokuGenerator {
  private board: number[][];
  public solvedBoard: number[][] = [];
  private readonly N = 9;
  private readonly SRN = 3;

  constructor() {
    this.board = Array.from({ length: this.N }, () => Array(this.N).fill(0));
  }

  public generateCompleteBoard(): number[][] {
    this.fillDiagonal();
    this.fillRemaining(0, this.SRN);
    return this.board;
  }

  private fillDiagonal(): void {
    for (let i = 0; i < this.N; i = i + this.SRN) {
      this.fillBox(i, i);
    }
  }

  private fillBox(rowStart: number, colStart: number): void {
    let num: number;
    for (let i = 0; i < this.SRN; i++) {
      for (let j = 0; j < this.SRN; j++) {
        do {
          num = this.randomGenerator(this.N);
        } while (!this.unUsedInBox(rowStart, colStart, num));
        this.board[rowStart + i][colStart + j] = num;
      }
    }
  }

  private fillRemaining(i: number, j: number): boolean {
    if (j >= this.N && i < this.N - 1) {
      i = i + 1;
      j = 0;
    }
    if (i >= this.N && j >= this.N) {
      return true;
    }
    if (i < this.SRN && j < this.SRN) {
      j = this.SRN;
    } else if (i < this.N - this.SRN) {
      if (j === Math.floor(i / this.SRN) * this.SRN) {
        j = j + this.SRN;
      }
    } else {
      if (j === this.N - this.SRN) {
        i = i + 1;
        j = 0;
        if (i >= this.N) {
          return true;
        }
      }
    }

    for (let num = 1; num <= this.N; num++) {
      if (this.checkIfSafe(i, j, num)) {
        this.board[i][j] = num;
        if (this.fillRemaining(i, j + 1)) {
          return true;
        }
        this.board[i][j] = 0;
      }
    }
    return false;
  }

  private checkIfSafe(i: number, j: number, num: number): boolean {
    return (
      this.unUsedInRow(i, num) &&
      this.unUsedInCol(j, num) &&
      this.unUsedInBox(i - (i % this.SRN), j - (j % this.SRN), num)
    );
  }

  private unUsedInRow(i: number, num: number): boolean {
    for (let j = 0; j < this.N; j++) {
      if (this.board[i][j] === num) return false;
    }
    return true;
  }

  private unUsedInCol(j: number, num: number): boolean {
    for (let i = 0; i < this.N; i++) {
      if (this.board[i][j] === num) return false;
    }
    return true;
  }

  private unUsedInBox(rowStart: number, colStart: number, num: number): boolean {
    for (let i = 0; i < this.SRN; i++) {
      for (let j = 0; j < this.SRN; j++) {
        if (this.board[rowStart + i][colStart + j] === num) return false;
      }
    }
    return true;
  }

  private randomGenerator(max: number): number {
    return Math.floor(Math.random() * max + 1);
  }

  public generatePlayableBoard(holesToDig: number): number[][] {
    this.generateCompleteBoard();
    
    // se guarda la solución
    this.solvedBoard = JSON.parse(JSON.stringify(this.board));

    const positions = Array.from({ length: 81 }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removedCount = 0;

    for (const pos of positions) {
      if (removedCount >= holesToDig) break;

      const row = Math.floor(pos / this.N);
      const col = pos % this.N;
      
      const backup = this.board[row][col];
      this.board[row][col] = 0;

      const gridCopy = this.board.map(r => [...r]);
      const counter = { solutions: 0 };
      
      this.countSolutions(gridCopy, counter);

      if (counter.solutions !== 1) {
        this.board[row][col] = backup;
      } else {
        removedCount++;
      }
    }

    return this.board;
  }

  private countSolutions(grid: number[][], counter: { solutions: number }): void {
    let row = -1;
    let col = -1;
    let isEmpty = false;

    for (let i = 0; i < this.N; i++) {
      for (let j = 0; j < this.N; j++) {
        if (grid[i][j] === 0) {
          row = i;
          col = j;
          isEmpty = true;
          break;
        }
      }
      if (isEmpty) break;
    }

    if (!isEmpty) {
      counter.solutions++;
      return;
    }

    for (let num = 1; num <= this.N && counter.solutions < 2; num++) {
      if (this.isSafeForGrid(grid, row, col, num)) {
        grid[row][col] = num;
        this.countSolutions(grid, counter);
        grid[row][col] = 0;
      }
    }
  }

  private isSafeForGrid(grid: number[][], row: number, col: number, num: number): boolean {
    for (let x = 0; x < this.N; x++) {
      if (grid[row][x] === num) return false;
      if (grid[x][col] === num) return false;
    }

    const startRow = row - (row % this.SRN);
    const startCol = col - (col % this.SRN);
    
    for (let i = 0; i < this.SRN; i++) {
      for (let j = 0; j < this.SRN; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }
}