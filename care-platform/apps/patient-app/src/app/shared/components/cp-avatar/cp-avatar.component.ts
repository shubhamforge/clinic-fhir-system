import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'cp-avatar',
  template: `
    <div
      class="cp-avatar"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.border-radius.px]="radius()"
      [style.background]="gradient()"
      [style.font-size.px]="fontSize()"
    >
      {{ initials() }}
    </div>
  `,
  styles: [
    `
      .cp-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpAvatarComponent {
  readonly firstName = input<string>('');
  readonly lastName = input<string>('');
  readonly hue = input<number>(168);
  readonly size = input<number>(44);
  readonly radiusPercent = input<number>(32);

  readonly initials = computed(() =>
    `${this.firstName()?.[0] ?? ''}${this.lastName()?.[0] ?? ''}`.toUpperCase(),
  );

  readonly gradient = computed(() => {
    const h = this.hue();
    return `linear-gradient(135deg, oklch(60% 0.12 ${h}), oklch(45% 0.14 ${h + 18}))`;
  });

  readonly radius = computed(() =>
    Math.round((this.size() * this.radiusPercent()) / 100),
  );

  readonly fontSize = computed(() => Math.round(this.size() * 0.35));
}
