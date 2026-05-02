import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponse, TimelineEvent, TrendsResponse } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getDashboard(patientId: string): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`/api/dashboard/${patientId}`);
  }

  getTimeline(patientId: string, limit = 20, before?: string): Observable<TimelineEvent[]> {
    let params = new HttpParams().set('limit', limit);
    if (before) params = params.set('before', before);
    return this.http.get<TimelineEvent[]>(`/api/patients/${patientId}/timeline`, { params });
  }

  getTrends(patientId: string, types = 'bp,spo2,weight', period = '30d'): Observable<TrendsResponse> {
    const params = new HttpParams().set('type', types).set('period', period);
    return this.http.get<TrendsResponse>(`/api/patients/${patientId}/trends`, { params });
  }
}
