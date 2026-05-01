import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { NgApexchartsModule } from 'ng-apexcharts';
import type {
  ApexAnnotations,
  ApexAxisChartSeries,
  ApexChart,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexNoData,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';
import { PatientService } from '../services/patient.service';
import {
  EncounterItem,
  ObservationPoint,
  PatientSummary,
  SelectedDetail,
} from '../models/patient-detail.model';

// Cyan/green palette matching M3 theme — hex required for ApexCharts JS config
const CHART_COLORS = ['#0891B2', '#22D3EE', '#16A34A', '#EA580C'];

@Component({
  selector: 'cp-patient-detail',
  standalone: true,
  imports: [
    DatePipe,
    TitleCasePipe,
    NgApexchartsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetailComponent implements OnInit {
  private readonly svc = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly patient = signal<PatientSummary | null>(null);
  readonly selectedDetail = signal<SelectedDetail | null>(null);

  private patientId = '';

  // ── Static chart configuration ──────────────────────────────────────────────

  readonly chartConfig: ApexChart = {
    type: 'line',
    height: 380,
    zoom: { enabled: true, type: 'x' },
    toolbar: {
      show: true,
      tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
    },
    animations: { enabled: false },
    events: {
      dataPointSelection: (_e, _ctx, config) => {
        this.zone.run(() => {
          this.handlePointSelection(
            config.seriesIndex,
            config.dataPointIndex,
            config.selectedDataPoints,
          );
          this.cdr.markForCheck();
        });
      },
    },
  };

  readonly chartColors = CHART_COLORS;

  readonly xaxisConfig: ApexXAxis = {
    type: 'datetime',
    labels: { datetimeUTC: false, format: 'MMM yy' },
    tooltip: { enabled: false },
  };

  readonly strokeConfig: ApexStroke = { curve: 'smooth', width: 2 };

  readonly markersConfig: ApexMarkers = {
    size: 4,
    hover: { size: 6 },
    discrete: [],
  };

  readonly legendConfig: ApexLegend = {
    position: 'top',
    horizontalAlign: 'left',
    onItemClick: { toggleDataSeries: true },
  };

  readonly gridConfig: ApexGrid = {
    borderColor: '#E2E8F0',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
  };

  readonly tooltipConfig: ApexTooltip = {
    x: { format: 'dd MMM yyyy' },
    shared: false,
  };

  readonly noDataConfig: ApexNoData = {
    text: 'No vitals recorded yet',
    style: { fontSize: '14px', color: '#64748B' },
  };

  // ── Computed chart data ──────────────────────────────────────────────────────

  readonly chartSeries = computed((): ApexAxisChartSeries => {
    const p = this.patient();
    if (!p) return [];

    const vitalTypes: Array<{ key: ObservationPoint['vitalType']; label: string }> = [
      { key: 'systolic',  label: 'Systolic BP' },
      { key: 'diastolic', label: 'Diastolic BP' },
      { key: 'weight',    label: 'Weight' },
      { key: 'spo2',      label: 'SpO₂' },
    ];

    return vitalTypes.map(({ key, label }) => ({
      name: label,
      data: p.allObservations
        .filter((o) => o.vitalType === key)
        .map((o) => ({ x: new Date(o.date).getTime(), y: o.value })),
    }));
  });

  readonly yaxisConfig = computed((): ApexYAxis[] => [
    {
      title: { text: 'BP (mmHg)', style: { color: CHART_COLORS[0] } },
      labels: { style: { colors: [CHART_COLORS[0]] } },
      seriesName: 'Systolic BP',
    },
    {
      show: false,
      seriesName: 'Systolic BP',
    },
    {
      opposite: true,
      title: { text: 'Weight (kg)', style: { color: CHART_COLORS[2] } },
      labels: { style: { colors: [CHART_COLORS[2]] } },
      seriesName: 'Weight',
    },
    {
      opposite: true,
      title: { text: 'SpO₂ (%)', style: { color: CHART_COLORS[3] } },
      labels: { style: { colors: [CHART_COLORS[3]] } },
      min: 85,
      max: 100,
      seriesName: 'SpO₂',
    },
  ]);

  readonly chartAnnotations = computed((): ApexAnnotations => {
    const p = this.patient();
    if (!p?.encounters.length) return {};

    return {
      xaxis: p.encounters
        .filter((e) => e.date)
        .map((e) => ({
          x: new Date(e.date).getTime(),
          strokeDashArray: 4,
          borderColor: '#94A3B8',
          label: {
            text: 'Visit',
            orientation: 'horizontal' as const,
            style: { background: 'transparent', color: '#94A3B8', fontSize: '10px', padding: { top: 2, bottom: 2 } },
          },
        })),
    };
  });

  readonly patientAge = computed(() => {
    const dob = this.patient()?.dob;
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadSummary();
  }

  loadSummary(): void {
    this.error.set(null);
    this.loading.set(true);
    this.selectedDetail.set(null);

    this.svc.getPatientSummary(this.patientId).subscribe({
      next: (summary) => {
        this.patient.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load patient. Check that the backend is running on port 9090.');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  clearSelection(): void {
    this.selectedDetail.set(null);
  }

  selectEncounter(encounter: EncounterItem): void {
    this.selectedDetail.set({ kind: 'encounter', data: encounter });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private handlePointSelection(
    seriesIndex: number,
    dataPointIndex: number,
    selectedDataPoints: number[][],
  ): void {
    const p = this.patient();
    if (!p || seriesIndex < 0) return;

    const isDeselected = !selectedDataPoints[seriesIndex]?.length;
    if (isDeselected) {
      this.selectedDetail.set(null);
      return;
    }

    const vitalTypes: Array<ObservationPoint['vitalType']> = [
      'systolic', 'diastolic', 'weight', 'spo2',
    ];

    if (seriesIndex < vitalTypes.length) {
      const vitalType = vitalTypes[seriesIndex];
      const sorted = p.allObservations
        .filter((o) => o.vitalType === vitalType)
        .sort((a, b) => a.date.localeCompare(b.date));
      const obs = sorted[dataPointIndex];
      if (obs) this.selectedDetail.set({ kind: 'observation', data: obs });
    }
  }
}
