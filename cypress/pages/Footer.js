export class Footer {
    root() {
        return cy.get('footer');
    }

    logo() {
        return this.root().find('img[alt*="SuBox"]');
    }
}