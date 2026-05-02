import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { PatientHeaderData } from '../../dashboard.model';

@Component({
  selector: 'cp-patient-header',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './cp-patient-header.component.html',
  styleUrl: './cp-patient-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpPatientHeaderComponent {
  @Input({ required: true }) data!: PatientHeaderData;

  get initials(): string {
    const parts = this.data.displayName.split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
