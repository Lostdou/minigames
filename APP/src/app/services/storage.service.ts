import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SudokuGenerator } from '../core/sudoku.generator';
import { WordleGenerator } from '../core/wordle.generator';

export interface SudokuState {
  board: number[][];
  initialBoard: number[][];
  solvedBoard: number[][];
  difficulty: number;
  timeElapsed?: number;
  isCompleted?: boolean;
  mistakes?: number;
}

export interface CompletedSudoku {
  difficulty: number;
  endTime: number;
  timeElapsed: number;
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

export interface CompletedWordle {
  language: 'es' | 'en';
  date: number;
  attempts: number;
  status: 'won' | 'lost';
  word: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  private sudokuStateSource = new BehaviorSubject<SudokuState | null>(this.loadSudokuInitialState('sudoku_save'));
  sudokuState$ = this.sudokuStateSource.asObservable();

  // observable para el historial de Sudoku
  private sudokuHistorySource = new BehaviorSubject<CompletedSudoku[]>(this.loadSudokuHistory());
  sudokuHistory$ = this.sudokuHistorySource.asObservable();

  private wordleStateSource = new BehaviorSubject<WordleState>(this.loadWordleInitialState('wordle_save'));
  wordleState$ = this.wordleStateSource.asObservable();

  private wordleHistorySource = new BehaviorSubject<CompletedWordle[]>(this.loadWordleHistory());
  wordleHistory$ = this.wordleHistorySource.asObservable();
  

  constructor() { }

  // ----- SUDOKU -----
  private loadSudokuInitialState(key: string): SudokuState | null {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  private loadSudokuHistory(): CompletedSudoku[] {
    const saved = localStorage.getItem('sudoku_history');
    return saved ? JSON.parse(saved) : [];
  }

  saveSudokuGame(gameState: SudokuState): void {
    localStorage.setItem('sudoku_save', JSON.stringify(gameState));
    this.sudokuStateSource.next(gameState);
  }

  addCompletedSudoku(difficulty: number, timeElapsed: number): void {
    const history = this.loadSudokuHistory();
    const newRecord: CompletedSudoku = {
      difficulty,
      endTime: Date.now(),
      timeElapsed
    };
    history.push(newRecord);
    localStorage.setItem('sudoku_history', JSON.stringify(history));
    this.sudokuHistorySource.next(history);
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
      difficulty: difficultyHoles,
      timeElapsed: 0,
      isCompleted: false,
      mistakes: 0
    };

    this.saveSudokuGame(initialState);
  }

  restartCurrentBoard(): void {
    const currentState = this.sudokuStateSource.getValue();
    if (currentState) {
      currentState.board = JSON.parse(JSON.stringify(currentState.initialBoard));
      currentState.timeElapsed = 0;
      currentState.isCompleted = false;
      currentState.mistakes = 0;
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

  private loadWordleHistory(): CompletedWordle[] {
    const saved = localStorage.getItem('wordle_history');
    return saved ? JSON.parse(saved) : [];
  }

  addCompletedWordle(record: CompletedWordle): void {
    const history = this.loadWordleHistory();
    
    // no duplicar el guardado si se recarga la pagina tras ganar
    const todaySeed = WordleGenerator.getTodaySeed();
    const alreadySaved = history.some(h => {
      const d = new Date(h.date);
      const hSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      return hSeed === todaySeed && h.language === record.language;
    });

    if (!alreadySaved) {
      history.push(record);
      localStorage.setItem('wordle_history', JSON.stringify(history));
      this.wordleHistorySource.next(history);
    }
  }

  saveWordleGame(state: WordleState): void {
    localStorage.setItem('wordle_save', JSON.stringify(state));
    this.wordleStateSource.next(state);
  }
}