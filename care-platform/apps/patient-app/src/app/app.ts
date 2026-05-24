import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
})
export class App {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showNav = computed(() => {
    const url = this.url();
    return !url.startsWith('/select') && !url.startsWith('/vitals/record');
  });

  readonly activeTab = computed(() => {
    const url = this.url();
    if (url.startsWith('/vitals')) return 'vitals';
    if (url.startsWith('/messages')) return 'messages';
    if (url.startsWith('/profile')) return 'profile';
    return 'home';
  });

  navigate(route: string): void {
    this.router.navigate(['/' + route]);
  }
}
