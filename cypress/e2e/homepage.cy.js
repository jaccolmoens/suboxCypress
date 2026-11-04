describe('Subox homepage', () => {
    it('toont de homepage', () => {
        cy.visit('http://localhost:4200/');

        cy.get('body').should('be.visible');
        cy.contains('Subox').should('be.visible');
    })
})