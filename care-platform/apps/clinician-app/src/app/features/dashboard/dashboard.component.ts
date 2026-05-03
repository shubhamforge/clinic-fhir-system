import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Subject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  exhaustMap,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardService } from './dashboard.service';
import {
  DashboardResponse,
  PatientHeaderData,
  TimelineEvent,
  TrendsResponse,
  extractPatientHeader,
} from './dashboard.model';
import { CpPatientHeaderComponent } from './components/cp-patient-header/cp-patient-header.component';
import { CpPatientHeaderSkeletonComponent } from './components/cp-patient-header-skeleton/cp-patient-header-skeleton.component';
import { CpPanelErrorComponent } from './components/cp-panel-error/cp-panel-error.component';
import { CpSnapshotPanelComponent } from './components/cp-snapshot-panel/cp-snapshot-panel.component';
import { CpSnapshotSkeletonComponent } from './components/cp-snapshot-skeleton/cp-snapshot-skeleton.component';
import { CpTimelinePanelComponent } from './components/cp-timeline-panel/cp-timeline-panel.component';
import { CpTimelineSkeletonComponent } from './components/cp-timeline-skeleton/cp-timeline-skeleton.component';

type AsyncState<T> = T | null | 'error';

@Component({
  selector: 'cp-dashboard',
  imports: [
    CpPatientHeaderComponent,
    CpPatientHeaderSkeletonComponent,
    CpPanelErrorComponent,
    CpSnapshotPanelComponent,
    CpSnapshotSkeletonComponent,
    CpTimelinePanelComponent,
    CpTimelineSkeletonComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(DashboardService);

  private readonly patientId$ = this.route.paramMap.pipe(
    map((p) => p.get('id')!),
    distinctUntilChanged(),
    shareReplay(1),
  );

  private readonly reload$ = new Subject<void>();
  private readonly loadMoreTimeline$ = new Subject<void>();

  private makeFetch$<T>(fetch: (id: string) => import('rxjs').Observable<T>) {
    return combineLatest([
      this.patientId$,
      this.reload$.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([id]) =>
        fetch(id).pipe(
          catchError(() => of('error' as const)),
          startWith(null),
        ),
      ),
      shareReplay(1),
    );
  }

  // Timeline uses paginated accumulation instead of makeFetch$
  private timelineFor(patientId: string) {
    let accumulated: TimelineEvent[] = [];
    return this.loadMoreTimeline$.pipe(
      startWith(undefined as void | undefined),
      exhaustMap(() => {
        const before = accumulated.length
          ? accumulated[accumulated.length - 1].date
          : undefined;
        return this.svc.getTimeline(patientId, 20, before).pipe(
          map((page) => {
            accumulated = [...accumulated, ...page];
            return accumulated as AsyncState<TimelineEvent[]>;
          }),
          catchError(() =>
            of(
              (accumulated.length ? accumulated : 'error') as AsyncState<
                TimelineEvent[]
              >,
            ),
          ),
          startWith(
            (accumulated.length ? accumulated : null) as AsyncState<
              TimelineEvent[]
            >,
          ),
        );
      }),
    );
  }

  private readonly dashboard$ = this.makeFetch$<DashboardResponse>((id) =>
    this.svc.getDashboard(id),
  );

  private readonly timeline$ = combineLatest([
    this.patientId$,
    this.reload$.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([id]) => this.timelineFor(id)),
    shareReplay(1),
  );

  private readonly trends$ = this.makeFetch$<TrendsResponse>((id) =>
    this.svc.getTrends(id),
  );

  readonly dashboard = toSignal<AsyncState<DashboardResponse>>(
    this.dashboard$,
    { initialValue: null },
  );
  readonly timeline = toSignal<AsyncState<TimelineEvent[]>>(this.timeline$, {
    initialValue: null,
  });
  readonly trends = toSignal<AsyncState<TrendsResponse>>(this.trends$, {
    initialValue: null,
  });

  // Patient / snapshot state
  readonly isPatientLoading = computed(() => this.dashboard() === null);
  readonly isPatientError = computed(() => this.dashboard() === 'error');

  readonly snapshotData = computed(() => {
    const d = this.dashboard();
    if (!d || d === 'error') return null;
    return d.snapshot;
  });

  readonly patientHeader = computed<PatientHeaderData | null>(() => {
    const d = this.dashboard();
    if (!d || d === 'error') return null;
    return extractPatientHeader(d.patient, d.careTeam);
  });

  // Timeline state
  readonly isTimelineLoading = computed(() => this.timeline() === null);
  readonly isTimelineError = computed(() => this.timeline() === 'error');

  readonly timelineData = computed(() => {
    const t = this.timeline();
    return t !== null && t !== 'error' ? (t as TimelineEvent[]) : [];
  });

  // Trends (passed to timeline panel for sparklines)
  readonly trendsData = computed(() => {
    const t = this.trends();
    return t !== null && t !== 'error' ? (t as TrendsResponse) : null;
  });

  reload(): void {
    this.reload$.next();
  }

  onLoadMore(): void {
    this.loadMoreTimeline$.next();
  }
}
