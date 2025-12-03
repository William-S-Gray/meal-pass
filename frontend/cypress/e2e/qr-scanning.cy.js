describe('QR Scanning', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.visit('/scan');
  });

  it('should successfully scan a valid QR code', () => {
    // Mock a successful QR scan
    cy.get('[data-testid="qr-scanner"]').then(() => {
      // Simulate scanning a valid QR code
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-scanned', {
          detail: { uniqueId: 'BEN-2025-0001' }
        }));
      });
    });
    
    // Verify success message
    cy.get('[data-testid="scan-success"]').should('be.visible');
    cy.get('[data-testid="beneficiary-name"]').should('be.visible');
  });

  it('should show error for already-fed beneficiary', () => {
    // Mock scanning an already-fed beneficiary
    cy.get('[data-testid="qr-scanner"]').then(() => {
      // Simulate scanning an already-fed QR code
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-scanned', {
          detail: { uniqueId: 'BEN-2025-0002' } // Assume this beneficiary is already fed
        }));
      });
    });
    
    // Verify warning message
    cy.get('[data-testid="already-fed-warning"]').should('be.visible');
  });

  it('should show error for unknown QR code', () => {
    // Mock scanning an unknown QR code
    cy.get('[data-testid="qr-scanner"]').then(() => {
      // Simulate scanning an unknown QR code
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-scanned', {
          detail: { uniqueId: 'UNKNOWN-ID' }
        }));
      });
    });
    
    // Verify error message
    cy.get('[data-testid="not-found-error"]').should('be.visible');
  });

  it('should allow manual entry when scanner fails', () => {
    // Switch to manual entry mode
    cy.get('[data-testid="manual-entry-toggle"]').click();
    
    // Enter unique ID manually
    cy.get('[data-testid="manual-id-input"]').type('BEN-2025-0001');
    cy.get('[data-testid="submit-manual-entry"]').click();
    
    // Verify success message
    cy.get('[data-testid="scan-success"]').should('be.visible');
  });
});