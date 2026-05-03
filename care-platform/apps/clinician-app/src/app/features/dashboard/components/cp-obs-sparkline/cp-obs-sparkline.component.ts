import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DataPoint } from '../../dashboard.model';

@Component({
  selector: 'cp-obs-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (svgData(); as d) {
      <svg
        class="obs-spark"
        [attr.width]="d.w"
        [attr.height]="d.h"
        [attr.viewBox]="'0 0 ' + d.w + ' ' + d.h"
      >
        @if (d.refY !== null) {
          <line
            x1="0"
            [attr.y1]="d.refY"
            [attr.x2]="d.w"
            [attr.y2]="d.refY"
            stroke="var(--px-warn)"
            stroke-width="0.6"
            stroke-dasharray="2 2"
            opacity="0.5"
          />
        }
        <path
          [attr.d]="d.path"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          [attr.cx]="d.dotX"
          [attr.cy]="d.dotY"
          r="1.8"
          [attr.fill]="color()"
        />
      </svg>
    }
  `,
  styles: [
    ':host { display: inline-flex; align-items: center; } svg { display: block; overflow: visible; }',
  ],
})
export class CpObsSparklineComponent {
  readonly points = input.required<DataPoint[]>();
  readonly width = input(64);
  readonly height = input(20);
  readonly color = input('currentColor');
  readonly refMax = input<number | null>(null);

  readonly svgData = computed(() => {
    const pts = this.points();
    const w = this.width();
    const h = this.height();
    const rm = this.refMax();
    const PAD = 3;

    if (pts.length < 2) return null;

    const vals = pts.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const xs = (i: number) => (i / (pts.length - 1)) * (w - 2) + 1;
    const ys = (v: number) => h - PAD - ((v - min) / span) * (h - PAD * 2);

    const path = pts
      .map(
        (p, i) =>
          `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.value).toFixed(1)}`,
      )
      .join(' ');
    const dotX = xs(pts.length - 1);
    const dotY = ys(pts[pts.length - 1].value);
    const refY = rm !== null && rm >= min && rm <= max ? ys(rm) : null;

    return { path, dotX, dotY, refY, w, h };
  });
}
