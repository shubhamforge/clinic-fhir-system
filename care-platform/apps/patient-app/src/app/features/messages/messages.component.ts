import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-messages',
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent {}
