import { Given } from '@cucumber/cucumber';
import { apiClient } from '../support/api-client';
import { SeedWorld } from '../support/world';

Given('a default practitioner exists in HAPI FHIR', async function (this: SeedWorld) {
  const practitioner = await apiClient.createPractitioner({
    resourceType: 'Practitioner',
    active: true,
    name: [{ family: 'Seed', given: ['Default'], prefix: ['Dr.'] }],
    gender: 'unknown',
  });
  this.log(`Created practitioner: ${practitioner.id}`);
});

Given('a default organization exists in HAPI FHIR', async function (this: SeedWorld) {
  const org = await apiClient.createOrganization({
    resourceType: 'Organization',
    active: true,
    name: 'Seed Dev Clinic',
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'prov',
            display: 'Healthcare Provider',
          },
        ],
      },
    ],
  });
  this.log(`Created organization: ${org.id}`);
});
