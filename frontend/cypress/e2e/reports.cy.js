describe('Reports Generation', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/reports');
  });

  it('should generate daily report', () => {
    cy.get('[data-testid="daily-report-tab"]').click();
    
    // Verify report data loads
    cy.get('[data-testid="report-table"]').should('be.visible');
    cy.get('[data-testid="report-data-row"]').should('have.length.greaterThan', 0);
    
    // Test export functionality
    cy.get('[data-testid="export-pdf-button"]').click();
    cy.get('[data-testid="download-complete"]').should('be.visible');
  });

  it('should generate date range report', () => {
    cy.get('[data-testid="range-report-tab"]').click();
    
    // Set date range
    cy.get('[data-testid="start-date-input"]').type('2025-12-01');
    cy.get('[data-testid="end-date-input"]').type('2025-12-31');
    cy.get('[data-testid="generate-report-button"]').click();
    
    // Verify report data loads
    cy.get('[data-testid="report-table"]').should('be.visible');
    cy.get('[data-testid="report-data-row"]').should('have.length.greaterThan', 0);
  });

  it('should display statistics dashboard', () => {
    cy.get('[data-testid="dashboard-tab"]').click();
    
    // Verify charts and statistics load
    cy.get('[data-testid="daily-totals-chart"]').should('be.visible');
    cy.get('[data-testid="weekly-trend-chart"]').should('be.visible');
    cy.get('[data-testid="fed-vs-not-fed-chart"]').should('be.visible');
    
    // Verify statistics cards
    cy.get('[data-testid="total-employees-card"]').should('be.visible');
    cy.get('[data-testid="total-fed-today-card"]').should('be.visible');
    cy.get('[data-testid="total-not-fed-today-card"]').should('be.visible');
  });
});