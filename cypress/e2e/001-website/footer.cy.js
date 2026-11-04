import { Footer } from "../../pages/Footer";
import { publicPages } from "../../support/publicPages";

describe("001- Footernavigatie", () => {
  const footer = new Footer();
publicPages
.filter((page) => page.inFooter).forEach((destination) => {
    it(`CY-001-015 - footerlink opent ${destination.name} pagina`, () => {
      cy.visit("/");

      footer
        .link(destination.path)
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.location("pathname").should("eq", destination.path);

      cy.get("main h1")
        .should("be.visible")
        .and("have.text", destination.heading)
        .and("have.length", 1);
    });
  });
});
