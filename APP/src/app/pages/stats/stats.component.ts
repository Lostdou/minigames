import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { StorageService, CompletedSudoku, WordleState, CompletedWordle } from '../../services/storage.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './stats.component.html'
})
export class StatsComponent implements OnInit {
  isDarkMode: boolean = false;
  
  sudokuHistory: CompletedSudoku[] = [];
  wordleState: WordleState | null = null;
  wordleHistory: CompletedWordle[] = [];

  // filtros para sudoku
  filterDate: string = ''; 
  sortByDuration: 'asc' | 'desc' | '' = '';

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.storageService.sudokuHistory$.subscribe(history => this.sudokuHistory = history);
    this.storageService.wordleState$.subscribe(state => this.wordleState = state);
    this.storageService.wordleHistory$.subscribe(history => this.wordleHistory = history);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  get filteredSudokuHistory(): CompletedSudoku[] {
    let result = [...this.sudokuHistory];
    
    // filtro x dia
    if (this.filterDate) {
      result = result.filter(item => {
        const d = new Date(item.endTime);
        const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return localDateStr === this.filterDate;
      });
    }
    
    // filtro x duracion
    if (this.sortByDuration === 'asc') {
      result.sort((a, b) => a.timeElapsed - b.timeElapsed);
    } else if (this.sortByDuration === 'desc') {
      result.sort((a, b) => b.timeElapsed - a.timeElapsed);
    }
    
    return result;
  }

  get reversedWordleHistory(): CompletedWordle[] {
    return [...this.wordleHistory].reverse();
  }

  // format aux
  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  formatDateTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleString('es-AR', { 
       day: '2-digit', 
       month: '2-digit', 
       year: 'numeric', 
       hour: '2-digit', 
       minute: '2-digit' 
     });
  }

  getSudokuDifficulty(difficulty: number): string {
    return difficulty === 30 ? 'Fácil' : difficulty === 40 ? 'Medio' : 'Difícil';
  }

  getWordleStatus(status: 'playing' | 'won' | 'lost'): string {
    switch(status) {
      case 'playing': return 'En progreso';
      case 'won': return '¡Ganado!';
      case 'lost': return 'Perdido';
      default: return '-';
    }
  }
}