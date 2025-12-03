describe('Card Printing', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/beneficiaries');
  });

  it('should print a single beneficiary card', () => {
    // Find the first beneficiary in the list and click print
    cy.get('[data-testid="beneficiary-row"]').first().within(() => {
      cy.get('[data-testid="print-button"]').click();
    });
    
    // Verify print preview opens
    cy.get('[data-testid="print-preview"]').should('be.visible');
    
    // Click print button
    cy.get('[data-testid="confirm-print"]').click();
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should bulk print beneficiary cards', () => {
    // Select multiple beneficiaries
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