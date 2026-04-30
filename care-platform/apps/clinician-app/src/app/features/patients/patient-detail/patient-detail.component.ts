import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../services/patient.service';
import { PatientSummary } from '../models/patient-detail.model';

@Component({
  selector: 'cp-patient-detail',
  standalone: true,
  imports: [
    DatePipe,
    TitleCasePipe,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetailComponent implements OnInit {
  private readonly svc = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly patient = signal<PatientSummary | null>(null);

  readonly encounterColumns = ['date', 'reason', 'status'];

  private patientId = '';

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadSummary();
  }

  loadSummary(): void {
    this.error.set(null);
    this.loading.set(true);

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
}
