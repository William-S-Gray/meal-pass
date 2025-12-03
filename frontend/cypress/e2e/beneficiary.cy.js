describe('Beneficiary Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/beneficiaries');
  });

  it('should add a new beneficiary', () => {
    cy.get('[data-testid="add-beneficiary-button"]').click();
    
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="gender-select"]').select('male');
    cy.get('[data-testid="age-input"]').type('30');
    
    cy.get('[data-testid="register-button"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.contains('John Doe').should('be.visible');
  });

  it('should edit an existing beneficiary', () => {
    // Find the first beneficiary in the list and click edit
    cy.get('[data-testid="beneficiary-row"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });
    
    cy.get('[data-testid="name-input"]').clear().type('Jane Smith');
    cy.get('[data-testid="save-button"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
  });

  it('should delete a beneficiary', () => {
    // Find the first beneficiary in the list and click delete
    cy.get('[data-testid="beneficiary-row"]').first().within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });
    
    cy.get('[data-testid="confirm-delete"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});