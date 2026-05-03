import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TimelineEvent, TrendsResponse } from '../../dashboard.model';
import { CpTimelineEventComponent } from '../cp-timeline-event/cp-timeline-event.component';

@Component({
  selector: 'cp-timeline-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CpTimelineEventComponent],
  template: `
    <div class="tl-group">
      <div class="tl-date-stripe">
        <span class="tl-date-label">{{ fmtDateLong }}</span>
        <span class="tl-date-rel cp-font-mono">{{ daysAgo }}</span>
        @if (isFuture) {
          <span class="tl-future-tag">UPCOMING</span>
        }
        <div class="tl-date-rule"></div>
      </div>
      @for (ev of events; track ev.id) {
        <cp-timeline-event
          [ev]="ev"
          [trends]="trends"
          [expanded]="expandedId === ev.id"
          [density]="density"
          (select)="select.emit($event)"
        />
      }
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class CpTimelineGroupComponent {
  @Input({ required: true }) date!: string;
  @Input({ required: true }) events!: TimelineEvent[];
  @Input() trends: TrendsResponse | null = null;
  @Input() expandedId: string | null = null;
  @Input() density: 'compact' | 'comfortable' = 'comfortable';
  @Output() select = new EventEmitter<string>();

  get isFuture(): boolean {
    return new Date(this.date) > new Date();
  }

  get fmtDateLong(): string {
    return new Date(this.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get daysAgo(): string {
    const ms = Date.now() - new Date(this.date).getTime();
    const d = Math.floor(ms / 86_400_000);
    if (d === 0) return 'today';
    if (d < 0) return `in ${-d}d`;
    if (d === 1) return '1d ago';
    if (d < 30) return `${d}d ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
  }
}
