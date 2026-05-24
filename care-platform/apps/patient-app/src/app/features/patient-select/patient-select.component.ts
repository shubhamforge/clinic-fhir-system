import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, startWith } from 'rxjs';
import { PatientAppService } from '../../shared/services/patient-app.service';
import { PatientSelectService } from '../../shared/services/patient-select.service';
import { PatientListItem } from '../../shared/models/patient-app.models';
import { CpAvatarComponent } from '../../shared/components/cp-avatar/cp-avatar.component';

@Component({
  selector: 'cp-patient-select',
  templateUrl: './patient-select.component.html',
  styleUrl: './patient-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CpAvatarComponent, TitleCasePipe],
})
export class PatientSelectComponent {
  private readonly svc = inject(PatientAppService);
  private readonly selectSvc = inject(PatientSelectService);
  private readonly router = inject(Router);

  readonly selectedId = signal<string | null>(null);

  readonly patients = toSignal(
    this.svc.getPatients().pipe(
      catchError(() => of([] as PatientListItem[])),
      startWith(null),
    ),
    { initialValue: null },
  );

  computeAge(dob: string): number {
    const today = new Date();
    const b = new Date(dob);
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return age;
  }

  select(id: string): void {
    this.selectedId.set(id);
    setTimeout(() => {
      this.selectSvc.select(id);
      this.router.navigate(['/home']);
    }, 220);
  }
}
