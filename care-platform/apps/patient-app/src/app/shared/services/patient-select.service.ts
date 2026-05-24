import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PatientSelectService {
  private readonly KEY = 'pa-patient-id';
  readonly selectedId = signal<string | null>(localStorage.getItem(this.KEY));

  select(id: string): void {
    localStorage.setItem(this.KEY, id);
    this.selectedId.set(id);
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
    this.selectedId.set(null);
  }
}
