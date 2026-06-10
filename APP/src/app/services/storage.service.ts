import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SudokuGenerator } from '../core/sudoku.generator';
import { WordleGenerator } from '../core/wordle.generator';

export interface SudokuState {
  board: number[][];
  initialBoard: number[][];
  solvedBoard: number[][];
  difficulty: number;
}

export interface WordleLangState {
  guesses: string[];
  lastPlayedDate: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

export interface WordleState {
  es: WordleLangState;
  en: WordleLangState;
}

export class StorageService {
  
  // estado sudoku
  private sudokuStateSource = new BehaviorSubject<SudokuState | null>(this.loadSudokuInitialState('sudoku_save'));
  sudokuState$ = this.sudokuStateSource.asObservable();

  // estado wordle
  private wordleStateSource = new BehaviorSubject<WordleState>(this.loadWordleInitialState('wordle_save'));
  wordleState$ = this.wordleStateSource.asObservable();

  constructor() { }

  // ----- SUDOKU -----
  private loadSudokuInitialState(key: string): SudokuState | null {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  saveSudokuGame(gameState: SudokuState): void {
    localStorage.setItem('sudoku_save', JSON.stringify(gameState));
    this.sudokuStateSource.next(gameState);
  }

  clearSudokuGame(): void {
    localStorage.removeItem('sudoku_save');
    this.sudokuStateSource.next(null);
  }

  startNewGame(difficultyHoles: number = 40): void {
    const generator = new SudokuGenerator();
    const newBoard = generator.generatePlayableBoard(difficultyHoles);
    
    const initialState: SudokuState = {
      board: JSON.parse(JSON.stringify(newBoard)),
      initialBoard: JSON.parse(JSON.stringify(newBoard)),
      solvedBoard: generator.solvedBoard,
      difficulty: difficultyHoles
    };

    this.saveSudokuGame(initialState);
  }

  restartCurrentBoard(): void {
    const currentState = this.sudokuStateSource.getValue();
    if (currentState) {
      currentState.board = JSON.parse(JSON.stringify(currentState.initialBoard));
      this.saveSudokuGame(currentState);
    }
  }

  // ----- WORDLE -----
  private loadWordleInitialState(key: string): WordleState {
    const saved = localStorage.getItem(key);
    const today = WordleGenerator.getTodaySeed();

    const defaultState: WordleState = {
      es: { guesses: [], lastPlayedDate: today, gameStatus: 'playing' },
      en: { guesses: [], lastPlayedDate: today, gameStatus: 'playing' }
    };

    if (saved) {
      const parsed: WordleState = JSON.parse(saved);
      
      // si el estado de ayer, resetea para hoy
      if (parsed.es.lastPlayedDate !== today) {
        parsed.es = { guesses: [], lastPlayedDate: today, gameStatus: 'playing' };
      }
      if (parsed.en.lastPlayedDate !== today) {
        parsed.en = { guesses: [], lastPlayedDate: today, gameStatus: 'playing' };
      }
      
      return parsed;
    }

    return defaultState;
  }

  saveWordleGame(state: WordleState): void {
    localStorage.setItem('wordle_save', JSON.stringify(state));
    this.wordleStateSource.next(state);
  }
}