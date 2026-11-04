export class HomePage {
    visit() {
        return cy.visit('/');
    }

    sections() {
        return cy.get('main section.home-section');
    }
}