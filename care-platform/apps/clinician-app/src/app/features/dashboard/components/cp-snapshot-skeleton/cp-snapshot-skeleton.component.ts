import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-snapshot-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../cp-snapshot-panel/cp-snapshot-panel.component.scss'],
  template: `
    <aside class="snapshot-panel">
      <div class="px-card">
        <div
          class="px-shimmer"
          style="height:12px;width:80px;margin-bottom:12px;border-radius:4px"
        ></div>
        <div class="vitals-grid">
          @for (i of tiles; track i) {
            <div class="px-shimmer" style="height:64px"></div>
          }
        </div>
      </div>
      <div class="px-card">
        <div
          class="px-shimmer"
          style="height:12px;width:100px;margin-bottom:10px;border-radius:4px"
        ></div>
        @for (i of rows; track i) {
          <div
            class="px-shimmer"
            style="height:40px;margin-bottom:8px;border-radius:6px"
          ></div>
        }
      </div>
      <div class="px-card">
        <div
          class="px-shimmer"
          style="height:12px;width:120px;margin-bottom:10px;border-radius:4px"
        ></div>
        @for (i of rows; track i) {
          <div
            class="px-shimmer"
            style="height:36px;margin-bottom:8px;border-radius:6px"
          ></div>
        }
      </div>
    </aside>
  `,
})
export class CpSnapshotSkeletonComponent {
  readonly tiles = [1, 2, 3, 4, 5, 6];
  readonly rows = [1, 2, 3];
}
