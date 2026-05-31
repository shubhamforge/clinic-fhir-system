import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { PatientSelectService } from './shared/services/patient-select.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
})
export class App {
  private readonly router = inject(Router);
  private readonly patientSelectSvc = inject(PatientSelectService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly desktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 900px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
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

  readonly patientInitials = computed(() => {
    const id = this.patientSelectSvc.selectedId();
    if (!id) return '?';
    const core = id.replace(/^seed-/, '');
    const parts = core.split('-').filter(Boolean);
    if (parts.length >= 2) {
      return (
        parts[parts.length - 2][0] + parts[parts.length - 1][0]
      ).toUpperCase();
    }
    return core.substring(0, 2).toUpperCase();
  });

  navigate(route: string): void {
    this.router.navigate(['/' + route]);
  }

  goSelectPatient(): void {
    this.router.navigate(['/select']);
  }
}
