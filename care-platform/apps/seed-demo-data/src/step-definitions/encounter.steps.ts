import { When } from '@cucumber/cucumber';
import { apiClient } from '../support/api-client';
import { daysAgo } from '../support/date-helpers';
import { SeedWorld } from '../support/world';

When(
  'an encounter is recorded {int} days ago with reason {string} and status {string}',
  async function (this: SeedWorld, days: number, reason: string, status: string) {
    if (!this.currentPatientId) throw new Error('No currentPatientId — patient step must run first');
    const visitDate = daysAgo(days);
    this.currentEncounterDate = visitDate;
    const encounter = await apiClient.createEncounter({
      patientId: this.currentPatientId,
      visitDate,
      reason,
      status,
    });
    if (!encounter.id) throw new Error('createEncounter returned no id');
    this.currentEncounterId = encounter.id;
    this.log(`Created encounter: ${encounter.id} (${visitDate})`);
  },
);
