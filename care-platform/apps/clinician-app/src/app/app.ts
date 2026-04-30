import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
