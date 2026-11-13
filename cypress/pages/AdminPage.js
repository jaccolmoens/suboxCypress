export class AdminPAge {
    root() {
        return cy.get('#main');
    }

    title() {
        return cy.get('.admin-page h1');
    }

    tabs() {
        return cy.get('.dossier-tabs');
    }

    reservationsButton () {
        return cy.get('#tab-reservations');
    }
}