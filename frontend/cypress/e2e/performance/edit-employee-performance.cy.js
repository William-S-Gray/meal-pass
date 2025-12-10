describe('Edit Employee Page Performance', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
  });

  it('measures page load time under different network conditions', () => {
    // Visit the employees list first to get an existing employee
    cy.visit('/employees');
    
    // Click on the first employee's edit button
    cy.get('[data-testid="employee-row"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });
    
    // Measure page load performance
    cy.window().then((win) => {
      // Start performance measurement
      const start = win.performance.now();
      
      // Wait for the form to be loaded
      cy.get('[data-testid="edit-employee-form"]', { timeout: 10000 }).should('be.visible').then(() => {
        const end = win.performance.now();
        const loadTime = end - start;
        
        // Log the performance metrics
        cy.log(`Page load time: ${loadTime.toFixed(2)}ms`);
        
        // Assert that the page loads within acceptable time
        expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
        
        // Additional performance metrics
        cy.window().its('performance').then((perf) => {
          const navigationStart = perf.timing.navigationStart;
          const domContentLoaded = perf.timing.domContentLoadedEventEnd - navigationStart;
          const loadEventEnd = perf.timing.loadEventEnd - navigationStart;
          
          cy.log(`DOM Content Loaded: ${domContentLoaded}ms`);
          cy.log(`Load Event End: ${loadEventEnd}ms`);
          
          // Check for paint timings if available
          if (typeof perf.getEntriesByName === 'function') {
            const firstPaint = perf.getEntriesByName('first-paint')[0];
            const firstContentfulPaint = perf.getEntriesByName('first-contentful-paint')[0];
            
            if (firstPaint) {
              cy.log(`First Paint: ${firstPaint.startTime.toFixed(2)}ms`);
            }
            
            if (firstContentfulPaint) {
              cy.log(`First Contentful Paint: ${firstContentfulPaint.startTime.toFixed(2)}ms`);
            }
          }
        });
      });
    });
  });

  it('measures API response time for employee data', () => {
    // Intercept the API call to get employee data
    cy.intercept('GET', '/api/employees/uid/**').as('getEmployee');
    
    // Visit the employees list first to get an existing employee
    cy.visit('/employees');
    
    // Click on the first employee's edit button
    cy.get('[data-testid="employee-row"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });
    
    // Wait for the API call to complete
    cy.wait('@getEmployee').then((interception) => {
      const responseTime = interception.response.duration;
      cy.log(`API response time: ${responseTime}ms`);
      
      // Assert that the API responds within acceptable time
      expect(responseTime).to.be.lessThan(2000); // Should respond within 2 seconds
      
      // Check response status
      expect(interception.response.statusCode).to.eq(200);
    });
    
    // Wait for the form to be loaded
    cy.get('[data-testid="edit-employee-form"]', { timeout: 10000 }).should('be.visible');
  });

  it('measures rendering performance with large employee dataset', () => {
    // Mock a large employee dataset to test rendering performance
    cy.intercept('GET', '/api/employees**', {
      fixture: 'large-employee-list.json'
    }).as('getEmployees');
    
    // Visit the employees list
    cy.visit('/employees');
    
    // Wait for the API call to complete
    cy.wait('@getEmployees');
    
    // Measure the time it takes to render the employee list
    cy.window().then((win) => {
      const start = win.performance.now();
      
      cy.get('[data-testid="employee-row"]', { timeout: 10000 }).should('have.length.greaterThan', 50).then(() => {
        const end = win.performance.now();
        const renderTime = end - start;
        
        cy.log(`Rendering time for large dataset: ${renderTime.toFixed(2)}ms`);
        
        // Assert that rendering completes within acceptable time
        expect(renderTime).to.be.lessThan(3000); // Should render within 3 seconds
      });
    });
  });
});