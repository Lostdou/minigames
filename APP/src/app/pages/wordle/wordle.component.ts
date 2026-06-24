import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { StorageService, WordleState } from '../../services/storage.service';
import { WordleGenerator, LetterStatus } from '../../core/wordle.generator';

@Component({
  selector: 'app-wordle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wordle.component.html'
})
export class WordleComponent implements OnInit {
  isDarkMode: boolean = false;
  
  // dict cargado del JSON
  dictionary: { es: string[], en: string[] } | null = null;
  
  // estado actual del juego
  currentLang: 'es' | 'en' = 'es';
  targetWord: string = '';
  
  guesses: string[] = [];
  currentGuess: string = '';
  gameStatus: 'playing' | 'won' | 'lost' = 'playing';

  // variables para UI
  errorMessage: string = '';
  keyboardStatuses: { [key: string]: LetterStatus } = {};

  // copia local del estado completo para evitar bugs al cambiar idioma
  private wordleState: WordleState | null = null;

  constructor(private http: HttpClient, private storageService: StorageService) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // se suscribe al estado guardado localmente
    this.storageService.wordleState$.subscribe(state => {
      this.wordleState = state;
      this.loadGameData();
    });

    // carga y normaliza el json (gracias claude por pasarme las palabras con tilde)
    this.http.get<{es: string[], en: string[]}>('words.json').subscribe({
      next: (data) => {
        console.log(data)
        this.dictionary = {
          es: data.es.map(word => this.normalizeWord(word)),
          en: data.en.map(word => this.normalizeWord(word))
        };
        this.loadGameData();
      },
      error: (err) => {
        console.error("Error cargando el diccionario.", err);
      }
    });
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  loadGameData(): void {
    if (!this.dictionary || !this.wordleState) return;

    // obtiene la palabra del dia según el idioma actual
    this.targetWord = WordleGenerator.getDailyWord(this.dictionary[this.currentLang]);

    const langState = this.wordleState[this.currentLang];
    this.guesses = [...langState.guesses];
    this.gameStatus = langState.gameStatus;
    this.currentGuess = '';

    this.updateKeyboardStatuses();
  }

  changeLanguage(lang: 'es' | 'en'): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.loadGameData();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.gameStatus !== 'playing') return;

    const key = event.key.toUpperCase();

    if (key === 'ENTER') {
      this.submitGuess();
    } else if (key === 'BACKSPACE') {
      this.deleteLetter();
    } else if (/^[A-ZÑ]$/.test(key)) {
      this.addLetter(key);
    }
  }

  addLetter(letter: string): void {
    if (this.currentGuess.length < 5) {
      this.currentGuess += letter;
    }
  }

  deleteLetter(): void {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
    }
  }

  submitGuess(): void {
    if (this.currentGuess.length !== 5) {
      this.showError('La palabra debe tener 5 letras');
      return;
    }

    if (!this.dictionary || !this.wordleState) return;

    const currentDict = this.dictionary[this.currentLang];
    if (!currentDict.includes(this.currentGuess)) {
      this.showError('La palabra no está en la lista');
      return;
    }

    this.guesses.push(this.currentGuess);
    
    const wasPlaying = this.gameStatus === 'playing';
    
    if (this.currentGuess === this.targetWord) {
      this.gameStatus = 'won';
    } else if (this.guesses.length >= 6) {
      this.gameStatus = 'lost';
    }

    // actualiza el storage para no perder progreso
    const updatedState: WordleState = JSON.parse(JSON.stringify(this.wordleState));
    updatedState[this.currentLang].guesses = this.guesses;
    updatedState[this.currentLang].gameStatus = this.gameStatus;
    updatedState[this.currentLang].lastPlayedDate = WordleGenerator.getTodaySeed();
    
    this.storageService.saveWordleGame(updatedState);

    // agregar al historial si acaba de ganar o perder
    if (wasPlaying && this.gameStatus !== 'playing') {
      this.storageService.addCompletedWordle({
        language: this.currentLang,
        date: Date.now(),
        attempts: this.guesses.length,
        status: this.gameStatus,
        word: this.targetWord
      });
    }
    
    this.updateKeyboardStatuses();
    
    this.currentGuess = '';
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => { this.errorMessage = ''; }, 2000);
  }

  getStatusesForGuess(guess: string): LetterStatus[] {
    return WordleGenerator.evaluateGuess(guess, this.targetWord);
  }

  private updateKeyboardStatuses(): void {
    this.keyboardStatuses = {};
    const weight = { correct: 3, present: 2, absent: 1 };

    for (const guess of this.guesses) {
      const statuses = this.getStatusesForGuess(guess);
      for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        const currentStatus = this.keyboardStatuses[letter];
        const newStatus = statuses[i];

        // si es amarillo(2) y se encontro el spot, pasa a ser verde(3)
        if (!currentStatus || weight[newStatus as keyof typeof weight] > weight[currentStatus as keyof typeof weight]) {
          this.keyboardStatuses[letter] = newStatus;
        }
      }
    }
  }

  private normalizeWord(word: string): string {
    return word.toUpperCase()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U');
  }
}