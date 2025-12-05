describe('Employee Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/employees');
  });

  it('should add a new employee', () => {
    cy.get('[data-testid="add-employee-button"]').click();
    
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="gender-select"]').select('male');
    cy.get('[data-testid="valid-until-input"]').type('2026-12-31');
    
    cy.get('[data-testid="register-button"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.contains('John Doe').should('be.visible');
  });

  it('should edit an existing employee', () => {
    // Find the first employee in the list and click edit
    cy.get('[data-testid="employee-row"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });
    
    cy.get('[data-testid="name-input"]').clear().type('Jane Smith');
    cy.get('[data-testid="save-button"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
  });

  it('should delete an employee', () => {
    // Find the first employee in the list and click delete
    cy.get('[data-testid="employee-row"]').first().within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });
    
    cy.get('[data-testid="confirm-delete"]').click();
    
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});