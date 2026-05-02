import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CpTopbarComponent } from './features/dashboard/components/cp-topbar/cp-topbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterModule, CpTopbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
