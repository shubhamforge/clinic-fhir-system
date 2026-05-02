import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'cp-vital-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './cp-vital-cell.component.html',
  styleUrl: './cp-vital-cell.component.scss',
})
export class CpVitalCellComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() unit = '';
  @Input() sub: string | null = null;
  @Input() icon: string | null = null;
  @Input() flagged = false;

  @HostBinding('class.flagged') get isFlagged() {
    return this.flagged;
  }
}
