import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SudokuComponent } from './pages/sudoku/sudoku.component';
import { WordleComponent } from './pages/wordle/wordle.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path:'sudoku',
        component: SudokuComponent
    },
    {
        path:'wordle',
        component: WordleComponent
    },
    {
        path:'**',
        redirectTo: ''
    }
];
