describe('001 - niet gevondenpagina', () => {
    it('CY-001-003 - toont een 404 pagina met een werkende weg naar huis', () => {
        cy.visit('/niet-bestaande-pagina', { failOnStatusCode: false });
        cy.get('main h1')
        .should('have.length', 1)
        .and('be.visible')
        .and('have.text', 'Deze aanwijzing loopt dood.');

        cy.contains('main a', 'Terug naar SuBox')
    .should('be.visible')
    .and('have.attr', 'href', '/')
    .click();

        cy.location('pathname')
        .should('eq', '/');
        cy.get('main .hero').should('be.visible');
    });
});