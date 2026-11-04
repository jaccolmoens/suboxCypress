import { publicPages } from "../../support/publicPages";

describe("001 - Publieke informatiepaginas", () => {
  publicPages.forEach((page) => {
    it(`CY-001-002 - ${page.name} is rechtstreeks en na vernieuwen bereikbaar`, () => {
      cy.visit(page.path);
      cy.get("main h1")
        .should("have.length", 1)
        .and("be.visible")
        .and("have.text", page.heading);
      cy.reload();
      cy.get("main h1")
        .should("have.length", 1)
        .and("be.visible")
        .and("have.text", page.heading);
    });
  });
});
