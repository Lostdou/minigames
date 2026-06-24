import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { StorageService, SudokuState } from '../../services/storage.service';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './sudoku.component.html'
})
export class SudokuComponent implements OnInit, OnDestroy {
  gameState: SudokuState | null = null;
  
  selectedRow: number = -1;
  selectedCol: number = -1;

  isDarkMode: boolean = false;
  animatingCells: {r: number, c: number}[] = [];

  // Variables para el temporizador
  timeElapsed: number = 0;
  timerInterval: any;

  errorMessage: string = '';

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.storageService.sudokuState$.subscribe(state => {
      // Detecta si es otro juego
      const isDifferentGame = !this.gameState || !state || this.gameState.initialBoard !== state.initialBoard;
      
      this.gameState = state;

      if (state) {
        if (isDifferentGame || state.timeElapsed === 0 || state.timeElapsed === undefined) {
          this.timeElapsed = state.timeElapsed || 0;
        }

        // Iniciar o parar el temporizador dependiendo del estado
        if (!state.isCompleted) {
          this.startTimer();
        } else {
          this.timeElapsed = state.timeElapsed || 0;
          this.stopTimer();
        }
      } else {
        this.stopTimer();
        this.timeElapsed = 0;
      }
    });

    // modo oscuro
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  // --- temporizador ---
  startTimer(): void {
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => {
        this.timeElapsed++;
        // autosave del tiempo cada 5 segundos
        if (this.timeElapsed % 5 === 0 && this.gameState && !this.gameState.isCompleted) {
          this.gameState.timeElapsed = this.timeElapsed;
          localStorage.setItem('sudoku_save', JSON.stringify(this.gameState));
        }
      }, 1000);
    }
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeElapsed / 60);
    const s = this.timeElapsed % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  @HostListener('window:beforeunload')
  saveTimeOnExit(): void {
    // si se cierra o refresca la pestaña, se guarda el tiempo exacto
    if (this.gameState && !this.gameState.isCompleted) {
      this.gameState.timeElapsed = this.timeElapsed;
      localStorage.setItem('sudoku_save', JSON.stringify(this.gameState));
    }
  }

  ngOnDestroy(): void {
    this.saveTimeOnExit();
    this.stopTimer();
  }
  // -------------------------------

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  newGame(holes?: number): void {
    this.selectedRow = -1;
    this.selectedCol = -1;
    const currentDifficulty = this.gameState?.difficulty || 40;
    this.storageService.startNewGame(holes == null ? currentDifficulty : holes);
  }

  selectCell(row: number, col: number): void {
    this.selectedRow = row;
    this.selectedCol = col;
  }

  inputNumber(num: number): void {
    if (!this.gameState || this.selectedRow === -1 || this.selectedCol === -1) return;
    
    // bloquear si es una celda inicial
    if (this.isInitialCell(this.selectedRow, this.selectedCol)) return;
  
    // bloquear si el juego ya termino
    if (this.gameState.isCompleted) return; 

    const currentValue = this.gameState.board[this.selectedRow][this.selectedCol];

    // bloquear modificaciones si la casilla ya tiene el número correcto
    if (currentValue !== 0 && currentValue === this.gameState.solvedBoard[this.selectedRow][this.selectedCol]) {
      return; 
    }

    // evitar contar un error si vuelve a ingresar el mismo número equivocado que ya estaba
    if (currentValue === num) return;

    // actualizar el tablero con el nuevo número
    this.gameState.board[this.selectedRow][this.selectedCol] = num;
    this.gameState.timeElapsed = this.timeElapsed; // Actualizar tiempo
    
    if (num !== 0) {
      const isCorrect = num === this.gameState.solvedBoard[this.selectedRow][this.selectedCol];
      
      if (isCorrect) {
        this.triggerSuccessAnimation(this.selectedRow, this.selectedCol);
      } else {
        // logica de errores (solo en dificil)
        if (this.gameState.difficulty === 50) {
          this.gameState.mistakes = (this.gameState.mistakes || 0) + 1;
          
          if (this.gameState.mistakes >= 3) {
            this.errorMessage = '¡Te quedaste sin intentos!';
            
            this.storageService.saveSudokuGame(this.gameState);
            
            setTimeout(() => {
              this.changeDifficulty();
              this.errorMessage = ''; 
            }, 2500);
            return;
          }
        }
      }
    }

    // check si se completo el tablero
    if (this.isBoardCompleted()) {
      this.gameState.isCompleted = true;
      this.stopTimer();
      this.storageService.addCompletedSudoku(this.gameState.difficulty, this.timeElapsed);
    }

    this.storageService.saveSudokuGame(this.gameState);
  }

  private triggerSuccessAnimation(row: number, col: number): void {
    let cellsToAnimate = [{r: row, c: col}];
    const currentNum = this.gameState!.board[row][col];

    if (this.checkRowCompleted(row)) {
      for (let i = 0; i < 9; i++) cellsToAnimate.push({r: row, c: i});
    }

    if (this.checkColCompleted(col)) {
      for (let i = 0; i < 9; i++) cellsToAnimate.push({r: i, c: col});
    }

    if (this.checkBoxCompleted(row, col)) {
      const startR = row - (row % 3);
      const startCol = col - (col % 3);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cellsToAnimate.push({r: startR + i, c: startCol + j});
        }
      }
    }
    
    if (this.isNumberCompleted(currentNum)) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.gameState!.board[r][c] === currentNum) {
            cellsToAnimate.push({r, c});
          }
        }
      }
    }

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