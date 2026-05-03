import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-snapshot-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../cp-snapshot-panel/cp-snapshot-panel.component.scss'],
  templateUrl: './cp-snapshot-skeleton.component.html',
})
export class CpSnapshotSkeletonComponent {
  readonly tiles = [1, 2, 3, 4, 5, 6];
  readonly rows = [1, 2, 3];
}
