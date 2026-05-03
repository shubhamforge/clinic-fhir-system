import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-timeline-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cp-timeline-skeleton.component.html',
  styleUrl: './cp-timeline-skeleton.component.scss',
})
export class CpTimelineSkeletonComponent {
  readonly pills = [1, 2, 3, 4, 5];
  readonly cardHeights = [64, 80, 60, 92, 64];
}
