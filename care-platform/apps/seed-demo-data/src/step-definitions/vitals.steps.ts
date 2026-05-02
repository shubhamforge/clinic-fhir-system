import { DataTable, When } from '@cucumber/cucumber';
import { CreateVitalsBody, apiClient } from '../support/api-client';
import { SeedWorld } from '../support/world';

When('vitals are recorded for that encounter:', async function (this: SeedWorld, dataTable: DataTable) {
  if (!this.currentPatientId) throw new Error('No currentPatientId');
  if (!this.currentEncounterId) throw new Error('No currentEncounterId — encounter step must run first');
  if (!this.currentEncounterDate) throw new Error('No currentEncounterDate');

  const row = dataTable.rowsHash() as Record<string, string>;
  const body: CreateVitalsBody = {
    patientId: this.currentPatientId,
    encounterId: this.currentEncounterId,
    effectiveDate: this.currentEncounterDate,
  };

  if (row['systolicBp'] !== undefined) body.systolicBp = parseFloat(row['systolicBp']);
  if (row['diastolicBp'] !== undefined) body.diastolicBp = parseFloat(row['diastolicBp']);
  if (row['weightKg'] !== undefined) body.weightKg = parseFloat(row['weightKg']);
  if (row['spo2Percent'] !== undefined) body.spo2Percent = parseFloat(row['spo2Percent']);
  if (row['heartRateBpm'] !== undefined) body.heartRateBpm = parseFloat(row['heartRateBpm']);
  if (row['temperatureCelsius'] !== undefined) body.temperatureCelsius = parseFloat(row['temperatureCelsius']);

  await apiClient.recordVitals(body);
  this.log(`Recorded vitals for encounter ${this.currentEncounterId}`);
});
