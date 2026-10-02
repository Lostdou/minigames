import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {
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

  constructor(private themeService: ThemeService) {}

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleDarkMode(): void {
    this.themeService.toggle();
  }
}