import { DataTable, Given } from '@cucumber/cucumber';
import { CreatePatientBody, apiClient } from '../support/api-client';
import { SeedWorld } from '../support/world';

Given('a patient exists with the following details:', async function (this: SeedWorld, dataTable: DataTable) {
  const row = dataTable.rowsHash() as Record<string, string>;
  const body: CreatePatientBody = {
    firstName: row['firstName'],
    lastName: row['lastName'],
    dateOfBirth: row['dateOfBirth'],
    gender: row['gender'],
    phone: row['phone'],
    email: row['email'],
  };
  const patient = await apiClient.createPatient(body);
  if (!patient.id) throw new Error('createPatient returned no id');
  this.currentPatientId = patient.id;
  this.log(`Created patient: ${patient.id} (${body.firstName} ${body.lastName})`);
});
