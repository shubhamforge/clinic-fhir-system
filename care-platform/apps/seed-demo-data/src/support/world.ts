import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';

export class SeedWorld extends World {
  currentPatientId: string | null = null;
  currentEncounterId: string | null = null;
  currentEncounterDate: string | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(SeedWorld);
