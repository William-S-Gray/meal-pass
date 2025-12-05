describe('Card Printing', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/employees');
  });

  it('should print a single employee card', () => {
    // Find the first employee in the list and click print
    cy.get('[data-testid="employee-row"]').first().within(() => {
      cy.get('[data-testid="print-button"]').click();
    });
    
    // Verify print preview opens
    cy.get('[data-testid="print-preview"]').should('be.visible');
    
    // Click print button
    cy.get('[data-testid="confirm-print"]').click();
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should bulk print employee cards', () => {
    // Select multiple employees
    cy.get('[data-testid="select-all-checkbox"]').click();
    
    // Click bulk print button
    cy.get('[data-testid="bulk-print-button"]').click();
    
    // Verify print preview opens with multiple cards
    cy.get('[data-testid="bulk-print-preview"]').should('be.visible');
    
    // Click print button
    cy.get('[data-testid="confirm-bulk-print"]').click();
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});