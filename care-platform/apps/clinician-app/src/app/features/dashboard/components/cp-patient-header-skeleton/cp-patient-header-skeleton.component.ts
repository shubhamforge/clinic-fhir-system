import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cp-patient-header-skeleton',
  templateUrl: './cp-patient-header-skeleton.component.html',
  styleUrl: './cp-patient-header-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpPatientHeaderSkeletonComponent {}
