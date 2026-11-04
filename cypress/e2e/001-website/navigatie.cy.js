import { Header } from "../../pages/Header";
import { viewports } from "../../support/viewports";

describe("001 - Navigatie", () => {
  const header = new Header();

  it(
    "CY-001-005 - opeend het aanbod vanaf een andere route onder het menu",
    viewports.desktop,
    () => {
      cy.visit("/over-ons");
      cy.get("main h1").and("be.visible");
      header.casesLink().should("be.visible").click();

      cy.location("pathname").should("eq", "/");
      cy.location("hash").should("eq", "#escape-koffers");
      header.root().then(($header) => {
        cy.get("#escape-koffers h2").should(($heading) => {
          const menu = $header[0].getBoundingClientRect();
          const heading = $heading[0].getBoundingClientRect();

          expect(heading.top, "aanbodkop staat onder het menu").to.be.at.least(
            menu.bottom,
          );

          expect(
            heading.bottom,
            "aanbodkop staat binnen het scherm",
          ).to.be.at.most($heading[0].ownerDocument.defaultView.innerHeight);
        });
      });
    },
  );

  it(
    "CY-001-006 - Escape sluit het mobiele menu en hersteld focus",
    viewports.mobile,
    () => {
      cy.visit("/");
      header
        .menuToggle()
        .should("be.visible")
        .and("have.attr", "aria-expanded", "false")
        .click()
        .should("have.attr", "aria-expanded", "true");

      header.menuToggle().type("{esc}");
      header
        .menuToggle()
        .should("have.attr", "aria-expanded", "false")
        .and("be.focused");
    },
  );

  it(
    "CY-001-007 - navigeren sluit het mobiele menu en focust de paginaknop",
    viewports.mobile,
    () => {
      cy.visit("/");
      header.menuToggle().click().should("have.attr", "aria-expanded", "true");

      header.rentalInfoLink().should("be.visible").click();

      cy.location("pathname").should("eq", "/uitleg");

      header.menuToggle().should("have.attr", "aria-expanded", "false");

      header.rentalInfoLink().should("not.be.visible");

      cy.get("main h1")
        .should("have.length", 1)
        .and("be.visible")
        .and("have.text", "Een groot avontuur. In een kleine koffer.")
        .and("be.focused");
    },
  );

  it(
    "CY-001-008 - bovenbalk verdwijt bij scrollen en keer terug bovaan",
    viewports.desktop,
    () => {
      cy.visit("/");

      cy.scrollTo("top");

      header.announcement().should("be.visible").and("not.have.class", "away");

      cy.scrollTo(0, 500);

      header
        .announcement()
        .should("have.class", "away")
        .and("have.attr", "aria-hidden", "true")
        .and("have.css", "height", "0px");

      cy.scrollTo("top");

      header
        .announcement()
        .should("not.have.class", "away")
        .and("have.attr", "aria-hidden", "false")
        .and("be.visible");
    },
  );

  Object.entries(viewports).forEach(([name, screen]) => {
    it("CY-001-009 - Menu en logo verkleinen zonder scrollsprong; mobiele knoppen blijven bedienbaar", () => {
      cy.viewport(screen.viewportWidth, screen.viewportHeight);
      cy.visit("/");

      cy.scrollTo("top");
      header
        .root()
        .invoke("outerHeight")
        .then((height) => {
          cy.wrap(height).as("originalHeaderHeight");
        });
      header
        .logo()
        .invoke("outerHeight")
        .then((height) => {
          cy.wrap(height).as("originalLogoHeight");
        });

      cy.scrollTo(0, 400);
      cy.get("@originalHeaderHeight").then((originalHeight) => {
        header
          .root()
          .invoke("outerHeight")
          .should("be.at.most", originalHeight * 0.55);
      });
      cy.get("@originalLogoHeight").then((originalHeight) => {
        header
          .logo()
          .invoke("outerHeight")
          .should("be.at.most", originalHeight * 0.55);
      });
      cy.window().its("scrollY").should("be.closeTo", 400, 1);
      if (screen.viewportWidth < 850) {
        header
          .menuToggle()
          .should("be.visible")
          .invoke("outerHeight")
          .should("be.at.least", 44);

        header.menuToggle().click();
        header.menuToggle().should("have.attr", "aria-expanded", "true");
      }
      header.rentalInfoLink().should("be.visible").click();

      cy.location("pathname").should("eq", "/uitleg");
      header.menuToggle().should("have.attr", "aria-expanded", "false");
    });
  });

  it(
    "CY-001-016 - skiplink brengt toetsenbord gebruikers naar de hoofdinhoud",
    viewports.desktop,
    () => {
      cy.visit("/");
        cy.get('main h1').should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused()
        .should("have.class", "skip-link")
        .and("be.visible")
        .and("have.attr", "href", "#main");

      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.location("hash").should("eq", "#main");

      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.focused().should(($element) => {
        expect(
          $element.closest("main").length,
          "volgende toetsenbordfocus ligt binnen de hoofdinhoud",
        ).to.equal(1);
      });
    },
  );
});
