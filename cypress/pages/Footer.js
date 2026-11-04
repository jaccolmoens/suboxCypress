export class Footer {
    root() {
        return cy.get('footer');
    }

    logo() {
        return this.root().find('img[alt*="SuBox"]');
    }

    link(path) {
        return this.root().find(`nav a[href="${path}"]`);
    }
}