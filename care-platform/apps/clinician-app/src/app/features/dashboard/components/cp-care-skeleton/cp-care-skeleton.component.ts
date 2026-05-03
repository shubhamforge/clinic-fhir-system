import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-care-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cp-care-skeleton.component.html',
  styleUrl: './cp-care-skeleton.component.scss',
})
export class CpCareSkeletonComponent {
  readonly goalRows = [1, 2];
  readonly orderRows = [1, 2, 3];
  readonly chartRects = [1, 2, 3];
}
