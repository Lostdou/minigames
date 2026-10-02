import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode: boolean;

  constructor() {
    // modo oscuro: lo guardado o la preferencia del sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  toggle(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  // la clase va en <html> para que tailwind (darkMode: 'class') y el body la tomen
  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }
}
