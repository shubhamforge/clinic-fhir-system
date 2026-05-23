import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CpTopbarComponent } from './features/dashboard/components/cp-topbar/cp-topbar.component';
import { CpToastComponent } from './shared/cp-toast/cp-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterModule, CpTopbarComponent, CpToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
