export class Header {
    root() {
        return cy.get('header');
    }

    homelink() {
        return this.root().find('a[aria-label*="naar de homepage"]');
    }
}