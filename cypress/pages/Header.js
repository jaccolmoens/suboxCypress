export class Header {
    root() {
        return cy.get('header');
    }

    homelink() {
        return this.root().find('a[aria-label*="naar de homepage"]');
    }

    casesLink() {
        return this.root().find('a[href*="/#escape-koffers"]');
    }

    menuToggle() {
        return this.root().find('.menu-toggle');
    }

    rentalInfoLink() {
        return this.root().find('nav a[href*="/uitleg"]');
    }

    announcement() {
        return this.root().get('.announcement');
    }

    haderMenu() {
        return this.root().find('nav');
    }

    logo() {
        return this.root().find('.wordmark img');
    }
}