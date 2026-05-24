import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { PatientAppService } from '../../../shared/services/patient-app.service';
import { PatientSelectService } from '../../../shared/services/patient-select.service';
import { PostVitalsRequest } from '../../../shared/models/patient-app.models';

@Component({
  selector: 'cp-record-vitals',
  templateUrl: './record-vitals.component.html',
  styleUrl: './record-vitals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class RecordVitalsComponent {
  private readonly svc = inject(PatientAppService);
  private readonly selectSvc = inject(PatientSelectService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly patientId = this.selectSvc.selectedId()!;
  readonly step = signal<0 | 1 | 2 | 3 | 4>(0);
  readonly saving = signal(false);

  readonly bpForm = this.fb.group({
    systolic: [
      120,
      [Validators.required, Validators.min(60), Validators.max(250)],
    ],
    diastolic: [
      80,
      [Validators.required, Validators.min(40), Validators.max(150)],
    ],
  });

  readonly weight = signal(70.0);
  readonly spo2 = signal(97);

  readonly bpHigh = computed(() => {
    const s = this.bpForm.value.systolic ?? 0;
    const d = this.bpForm.value.diastolic ?? 0;
    return s >= 140 || d >= 90;
  });

  readonly spo2Low = computed(() => this.spo2() < 94);

  readonly progressBars = computed(() =>
    [0, 1, 2, 3].map((i) => ({
      done: i < this.step(),
      active: i === this.step(),
    })),
  );

  goBack(): void {
    if (this.step() === 0) {
      this.router.navigate(['/home']);
    } else {
      this.step.update((s) => (s - 1) as 0 | 1 | 2 | 3 | 4);
    }
  }

  goNext(): void {
    if (this.step() < 3) {
      this.step.update((s) => (s + 1) as 0 | 1 | 2 | 3 | 4);
    } else {
      this.save();
    }
  }

  adjustWeight(delta: number): void {
    this.weight.update((v) => Math.round((v + delta) * 10) / 10);
  }

  adjustSpo2(delta: number): void {
    this.spo2.update((v) => Math.max(70, Math.min(100, v + delta)));
  }

  private save(): void {
    this.saving.set(true);
    const today = new Date().toISOString().split('T')[0];
    const patientId = this.patientId;

    const systolicReq: PostVitalsRequest = {
      patientId,
      effectiveDate: today,
      systolicBp: this.bpForm.value.systolic ?? undefined,
    };
    const diastolicReq: PostVitalsRequest = {
      patientId,
      effectiveDate: today,
      diastolicBp: this.bpForm.value.diastolic ?? undefined,
    };
    const weightReq: PostVitalsRequest = {
      patientId,
      effectiveDate: today,
      weightKg: this.weight(),
    };
    const spo2Req: PostVitalsRequest = {
      patientId,
      effectiveDate: today,
      spo2Percent: this.spo2(),
    };

    forkJoin([
      this.svc.postVitals(systolicReq),
      this.svc.postVitals(diastolicReq),
      this.svc.postVitals(weightReq),
      this.svc.postVitals(spo2Req),
    ]).subscribe({
      next: () => {
        this.saving.set(false);
        this.step.set(4);
        setTimeout(() => this.router.navigate(['/vitals']), 1800);
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Something went wrong. Please try again.', 'OK', {
          duration: 4000,
        });
      },
    });
  }
}
