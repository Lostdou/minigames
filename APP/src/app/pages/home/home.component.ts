import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  isDarkMode: boolean = false;

  games = [
    {
      title: 'Sudoku',
      route: '/sudoku',
      bgClass: 'bg-[#8b5cf6] dark:bg-[#6d28d9]', 
      textClass: 'text-white',
    },
    {
      title: 'Wordle',
      route: '/wordle',
      bgClass: 'bg-[#f43f5e] dark:bg-[#e11d48]',
      textClass: 'text-white',
    },
    {
      title: 'Estadisticas',
      route: '/stats',
      bgClass: 'bg-[#34d399] dark:bg-[#059669]',
      textClass: 'text-slate-900',
    }
  ];

  ngOnInit(): void {
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
}