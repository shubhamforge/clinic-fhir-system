export interface VitalReading {
  value: number | null;
  unit: string;
  date: string;
  flagged: boolean;
}

export interface AlertItem {
  severity: string;
  type: string;
  message: string;
  resourceId: string;
}

export interface LatestVitals {
  systolicBp: VitalReading | null;
  diastolicBp: VitalReading | null;
  weightKg: VitalReading | null;
  spo2Percent: VitalReading | null;
}

export interface SnapshotResponse {
  activeConditions: Record<string, unknown>[];
  currentMedications: Record<string, unknown>[];
  latestVitals: LatestVitals;
  alerts: AlertItem[];
}

export interface GoalProgress {
  currentValue: number | null;
  targetValue: number | null;
  onTrack: boolean;
  percentToGoal: number | null;
  message: string;
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface BpSeries {
  systolic: DataPoint[];
  diastolic: DataPoint[];
  referenceRange: Record<string, number>;
}

export interface SimpleSeries {
  values: DataPoint[];
  unit: string;
  referenceRange: Record<string, unknown>;
}

export interface TrendsResponse {
  period: string;
  from: string;
  to: string;
  series: Record<string, BpSeries | SimpleSeries>;
}

export interface TimelineEvent {
  id: string;
  type: string;
  date: string;
  title: string;
  subtitle: string;
  status: string;
  resourceId: string;
  metadata: Record<string, unknown>;
}

export interface PatientSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  gender: string | null;
  mrn: string;
  phone: string | null;
  email: string | null;
}

export interface DashboardResponse {
  patient: PatientSummary;
  careTeam: Record<string, unknown>;
  snapshot: SnapshotResponse;
  upcomingAppointment: Record<string, unknown> | null;
  recentEncounters: Record<string, unknown>[];
  pendingServiceRequests: Record<string, unknown>[];
  activeCarePlan: Record<string, unknown> | null;
  recentDiagnosticReport: Record<string, unknown> | null;
  warnings: string[];
}

export interface PatientHeaderData {
  id: string;
  displayName: string;
  age: number | null;
  gender: string;
  dob: string;
  mrn: string;
  pcp: string;
}

export function extractPatientHeader(
  p: PatientSummary,
  careTeam?: Record<string, unknown>,
): PatientHeaderData {
  const displayName = [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
  const age = p.dob ? Math.floor((Date.now() - Date.parse(p.dob)) / 31_557_600_000) : null;
  const primaryDoctor = careTeam?.['primaryDoctor'] as Record<string, unknown> | undefined;
  const pcp = (primaryDoctor?.['name'] as string) ?? '—';

  return {
    id: p.id,
    displayName,
    age,
    gender: p.gender ?? '—',
    dob: p.dob ?? '—',
    mrn: p.mrn,
    pcp,
  };
}
