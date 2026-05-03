import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-timeline-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tl-skeleton">
      <div class="tl-sk-header">
        <div
          class="px-shimmer"
          style="height:14px;width:130px;border-radius:4px"
        ></div>
        <div class="tl-sk-pills">
          @for (p of pills; track p) {
            <div
              class="px-shimmer"
              style="height:26px;width:52px;border-radius:14px"
            ></div>
          }
        </div>
      </div>
      <div class="tl-sk-body">
        @for (h of cardHeights; track h; let i = $index) {
          <div class="tl-sk-event">
            <div class="px-shimmer tl-sk-node"></div>
            <div class="px-shimmer tl-sk-card" [style.height.px]="h"></div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .tl-skeleton {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .tl-sk-header {
        padding: 14px 20px 10px;
        border-bottom: 1px solid var(--px-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .tl-sk-pills {
        display: flex;
        gap: 6px;
      }
      .tl-sk-body {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .tl-sk-event {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 10px;
        align-items: flex-start;
      }
      .tl-sk-node {
        width: 26px;
        height: 26px;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .tl-sk-card {
        border-radius: 8px;
      }
    `,
  ],
})
export class CpTimelineSkeletonComponent {
  readonly pills = [1, 2, 3, 4, 5];
  readonly cardHeights = [64, 80, 60, 92, 64];
}
