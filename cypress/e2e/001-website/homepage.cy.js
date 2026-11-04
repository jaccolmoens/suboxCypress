import { HomePage } from '../../pages/HomePage';
import { Header } from '../../pages/Header';
import { Footer } from '../../pages/Footer';

describe('001 - Homepage', () => {
    const home = new HomePage();
    const header = new Header();
    const footer = new Footer();

    beforeEach(() => {
        cy.viewport(1280, 900);
        home.visit();
    });

    it('CY-001-001 - toont 5 secties in volgorde met header en footer', () => {
        header.root().should('be.visible');
        header.homelink().should('be.visible').and('have.attr', 'href', '/');
        
        const expectedOrder = [
            'hero',
            'cases-section',
            'experiences-section',
            'reservation-section',
            'reviews-section',
        ];

        home.sections().should(($sections) => {
            expect($sections).to.have.length(expectedOrder.length);
            expectedOrder.forEach((className, index) => {
                expect($sections.eq(index)).to.have.class(className);
            });
        });

        expectedOrder.forEach((className, index) => {
            home.sections()
            .eq(index)
            .scrollIntoView()
            .should('be.visible');
        });

        footer.root().scrollIntoView().should('be.visible');
        footer.logo().should('be.visible');
    });
});
