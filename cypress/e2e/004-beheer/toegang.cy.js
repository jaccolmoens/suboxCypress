import { viewports } from "../../support/viewports";


describe('004 - toegang Login', viewports.desktop, () => {
    it("CY-004-001 niet ingelogde gebruiker komt /beheer komt op login pagina", () => {
        cy.visit('/beheer');
        cy.location('pathname').should('eq', '/login');

        cy.get('main h1').should('be.visible').and('have.text', 'Inloggen');
        cy.get('.info-page').find('#username').should('be.visible');

        cy.get('.admin-page').should('not.exist');
    })
})