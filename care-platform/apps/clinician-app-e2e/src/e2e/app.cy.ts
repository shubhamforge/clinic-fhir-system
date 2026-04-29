describe('clinician-app', () => {
  beforeEach(() => cy.visit('/'));

  it('should load', () => {
    cy.get('app-root').should('exist');
  });
});
