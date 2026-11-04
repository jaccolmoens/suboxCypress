import { Header } from "../../pages/Header";
import { viewports } from '../../support/viewports';

function setReducedMotion(value) {
  return cy.then(() => {
    return Cypress.automation("remote:debugger:protocol", {
      command: "Emulation.setEmulatedMedia",
      params: {
        features: [
          {
            name: "prefers-reduced-motion",
            value: value,
          },
        ],
      },
    });
  });
}

describe("001 - Verminderde beweging", () => {
  const header = new Header();

  beforeEach(() => {
    setReducedMotion("reduce");
  });
  afterEach(() => {
    setReducedMotion("");
  });

  it("CY-001-010 - schakeld overgangsanimaties uit", viewports.desktop, () => {
    cy.visit("/");

    cy.window().should((win) => {
      const prefersReducedMotion = win.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      expect(prefersReducedMotion.matches).to.equal(true);
    });
      header.announcement().should("have.css", "transition-duration", "0s");
      header.root().should("have.css", "transition-duration", "0s");
      header.logo().should("have.css", "transition-duration", "0s");

      cy.scrollTo(0, 400);
      header
        .announcement()
        .should("have.class", "away")
        .and("have.css", "height", "0px");

      cy.scrollTo("top");
      header.announcement().should("not.have.class", "away").and("be.visible");
    });
  });
