import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { StorageService, SudokuState } from '../../services/storage.service';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './sudoku.component.html'
})
export class SudokuComponent implements OnInit {
  gameState: SudokuState | null = null;
  
  selectedRow: number = -1;
  selectedCol: number = -1;

  isDarkMode: boolean = false;
  animatingCells: {r: number, c: number}[] = [];

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.storageService.sudokuState$.subscribe(state => {
      this.gameState = state;
    });

    // modo oscuro
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  // cambiar el modo oscuro y guardarlo
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  newGame(holes?: number): void {
    this.selectedRow = -1;
    this.selectedCol = -1;

    if (holes == null) {
      // si no se especifica, se toma la dificultad actual (default 40)
      const currentDifficulty = this.gameState?.difficulty || 40;
      this.storageService.startNewGame(currentDifficulty);
    } else {
      // facil(30) - medio(40) - dificil(50)
      this.storageService.startNewGame(holes);
    }
  }

  selectCell(row: number, col: number): void {
    this.selectedRow = row;
    this.selectedCol = col;
  }

  inputNumber(num: number): void {
    if (!this.gameState || this.selectedRow === -1 || this.selectedCol === -1) return;
    if (this.isInitialCell(this.selectedRow, this.selectedCol)) return;

    this.gameState.board[this.selectedRow][this.selectedCol] = num;
    
    const isCorrect = num !== 0 && num === this.gameState.solvedBoard[this.selectedRow][this.selectedCol];
    
    if (isCorrect) {
      this.triggerSuccessAnimation(this.selectedRow, this.selectedCol);
    }

    this.storageService.saveSudokuGame(this.gameState);
  }

  private triggerSuccessAnimation(row: number, col: number): void {
    let cellsToAnimate = [{r: row, c: col}];
    const currentNum = this.gameState!.board[row][col];

    // completa fila
    if (this.checkRowCompleted(row)) {
      for (let i = 0; i < 9; i++) cellsToAnimate.push({r: row, c: i});
    }

    // completa columna
    if (this.checkColCompleted(col)) {
      for (let i = 0; i < 9; i++) cellsToAnimate.push({r: i, c: col});
    }

    // completa 3x3
    if (this.checkBoxCompleted(row, col)) {
      const startR = row - (row % 3);
      const startCol = col - (col % 3);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cellsToAnimate.push({r: startR + i, c: startCol + j});
        }
      }
    }
    
    // completa todas las casillas de un mismo numero
    if (this.isNumberCompleted(currentNum)) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.gameState!.board[r][c] === currentNum) {
            cellsToAnimate.push({r, c});
          }
        }
      }
    }

    // completa tablero
    if (this.isBoardCompleted()) {
      cellsToAnimate = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          cellsToAnimate.push({r, c});
        }
      }
    }



    this.animatingCells = cellsToAnimate;
    setTimeout(() => { this.animatingCells = []; }, 600);
  }

  isAnimating(row: number, col: number): boolean {
    return this.animatingCells.some(cell => cell.r === row && cell.c === col);
  }

  private checkRowCompleted(row: number): boolean {
    for (let c = 0; c < 9; c++) {
      if (this.gameState!.board[row][c] !== this.gameState!.solvedBoard[row][c]) return false;
    }
    return true;
  }

  private checkColCompleted(col: number): boolean {
    for (let r = 0; r < 9; r++) {
      if (this.gameState!.board[r][col] !== this.gameState!.solvedBoard[r][col]) return false;
    }
    return true;
  }

  private checkBoxCompleted(row: number, col: number): boolean {
    const startR = row - (row % 3);
    const startCol = col - (col % 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.gameState!.board[startR + r][startCol + c] !== this.gameState!.solvedBoard[startR + r][startCol + c]) return false;
      }
    }
    return true;
  }

  isInitialCell(row: number, col: number): boolean {
    return this.gameState?.initialBoard[row][col] !== 0;
  }

  isError(row: number, col: number): boolean {
    if (!this.gameState || this.gameState.board[row][col] === 0) return false;
    return this.gameState.board[row][col] !== this.gameState.solvedBoard[row][col];
  }

  isHighlighted(row: number, col: number): boolean {
    if (!this.gameState || this.selectedRow === -1 || this.selectedCol === -1) return false;
    const selectedValue = this.gameState.board[this.selectedRow][this.selectedCol];
    if (selectedValue === 0) return false;
    return this.gameState.board[row][col] === selectedValue;
  }

  isNumberCompleted(n: number): boolean {
    if (!this.gameState) return false;
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.gameState.board[r][c] === n && this.gameState.board[r][c] === this.gameState.solvedBoard[r][c]) {
          count++;
        }
      }
    }
    return count === 9;
  }

  private isBoardCompleted(): boolean {
    if (!this.gameState) return false;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        // si hay una celda vacia o incorrecta, el tablero no esta completado
        if (this.gameState.board[r][c] === 0 || this.gameState.board[r][c] !== this.gameState.solvedBoard[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  resetCurrentBoard(): void {
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.storageService.restartCurrentBoard();
  }

  changeDifficulty(): void {
    this.storageService.clearSudokuGame();
  }
}