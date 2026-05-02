import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'cp-panel-error',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './cp-panel-error.component.html',
  styleUrl: './cp-panel-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpPanelErrorComponent {
  @Input() message = 'Something went wrong';
  @Output() retry = new EventEmitter<void>();
}
