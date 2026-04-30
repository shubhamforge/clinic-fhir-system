import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PatientService } from '../services/patient.service';
import { PatientListItem } from '../models/patient-list-item.model';

@Component({
  selector: 'app-patient-roster',
  standalone: true,
  imports: [
    TitleCasePipe,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './patient-roster.component.html',
  styleUrl: './patient-roster.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientRosterComponent implements OnInit, AfterViewInit {
  private readonly svc = inject(PatientService);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'gender', 'dob', 'lastEncounter', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<PatientListItem>([]);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Table and paginator are always in the DOM ([hidden] approach), so ViewChild
  // resolves reliably in ngAfterViewInit without needing setTimeout.
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    // Search by patient name or date of birth
    this.dataSource.filterPredicate = (data: PatientListItem, filter: string) => {
      const q = filter.toLowerCase();
      return data.name.toLowerCase().includes(q) || data.dob.includes(q);
    };

    this.loadPatients();
  }

  ngAfterViewInit(): void {
    // Wire up sort and paginator here — elements are always in the DOM via [hidden]
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadPatients(): void {
    this.error.set(null);
    this.loading.set(true);

    this.svc.getPatients().subscribe({
      next: (patients) => {
        this.dataSource.data = patients;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load patients. Check that the backend is running on port 9090.');
        this.loading.set(false);
      },
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  clearFilter(input: HTMLInputElement): void {
    input.value = '';
    this.dataSource.filter = '';
    this.dataSource.paginator?.firstPage();
  }

  viewPatient(id: string): void {
    this.router.navigate(['/patients', id]);
  }

  get filteredCount(): number {
    return this.dataSource.filteredData.length;
  }

  get totalCount(): number {
    return this.dataSource.data.length;
  }
}
