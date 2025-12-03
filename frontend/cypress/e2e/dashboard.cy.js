describe('Dashboard Flow', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/dashboard');
  });

  it('should display dashboard metrics correctly', () => {
    // Verify all dashboard metrics are present
    cy.get('[data-testid="total-beneficiaries"]').should('be.visible');
    cy.get('[data-testid="total-fed-today"]').should('be.visible');
    cy.get('[data-testid="total-not-fed-today"]').should('be.visible');
    cy.get('[data-testid="monthly-feeding-graph"]').should('be.visible');
    
    // Verify quick action buttons
    cy.get('[data-testid="add-beneficiary-button"]').should('be.visible');
    cy.get('[data-testid="print-bulk-cards-button"]').should('be.visible');
    cy.get('[data-testid="view-reports-button"]').should('be.visible');
  });

  it('should navigate to beneficiary list from quick actions', () => {
    cy.get('[data-testid="view-beneficiaries-button"]').click();
    cy.url().should('include', '/beneficiaries');
  });

  it('should navigate to reports from quick actions', () => {
    cy.get('[data-testid="view-reports-button"]').click();
    cy.url().should('include', '/reports');
  });

  it('should navigate to QR scanner from quick actions', () => {
    cy.get('[data-testid="scan-qr-button"]').click();
    cy.url().should('include', '/scan');
  });
});