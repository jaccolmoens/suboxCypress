import { viewports } from "../../support/viewports";
import { loginAdminFE } from "../../support/login";

describe("004 - toegang Login", viewports.desktop, () => {
  it("CY-004-001 niet ingelogde gebruiker komt /beheer komt op login pagina", () => {
    cy.visit("/beheer");
    cy.location("pathname").should("eq", "/login");

    cy.get("main h1").should("be.visible").and("have.text", "Inloggen");
    cy.get(".info-page").find("#username").should("be.visible");

    cy.get(".admin-page").should("not.exist");
  });

  it("CY-004-002 - foutieve wachtwoord geeft duidelijke foutmelding", () => {
    cy.visit("/login");
    cy.location("pathname").should("eq", "/login");

    cy.env(["adminUsername"]).then(({ adminUsername }) => {
      if (typeof adminUsername !== "string") {
        throw new Error("Stel adminUsername en adminPassword in.");
      }
      cy.get("main h1").should("be.visible").and("have.text", "Inloggen");
      cy.get("main #username").should("be.visible").type(adminUsername);
      cy.get("main #password").should("be.visible").type("testWachtwoord");
      cy.get('button[type="submit"].button').click();
      cy.get('form p[role="alert"]')
        .should("be.visible")
        .and("have.text", "Gebruikersnaam of wachtwoord klopt niet");
    });
    cy.request({
      method: "GET",
      url: "/api/auth/session",
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);
  });

  it("CY-004-004 - een login toont de juiste beheerpagina zonder navigeren", () => {
    loginAdminFE();
    cy.location('pathname').should('eq', '/beheer');
    cy.get('main h1').should('have.text', 'Beheer');
    cy.get('#main-menu [href="/beheer"]').should('be.visible');
  });

    it("CY-004-007 / CY-004-009 - geweigerde opslag toont uitleg zonder succesmelding; opnieuw inloggen werkt", () => {
        loginAdminFE();
        cy.get('[aria-label="Escape koffer volgorde"] .icon-button[aria-label="Bewerken: The Clockmakers Secret"]')
        .should('be.visible').click();

        cy.intercept('PUT', '/api/admin/cases/*', {
            statusCode: 401,
            body: {
                code: 'REQUEST_FAILED',
                message: 'Je sessie is verlopen; log opnieuw in',
                requestId: 'cy-sessieverval-007'
            },
        }).as('saveExpiredSession');

        cy.get('#cases-form [type="submit"]').should('be.visible').click();

        cy.wait('@saveExpiredSession').its('response.statusCode').should('eq', 401);

        cy.get('#admin-error[role="alert"]').should('be.visible').and('have.text', 'Je sessie is verlopen; log opnieuw in');
        cy.get('[aria-label="Resultaat van je actie"] p[role="status"]').should('not.exist');
        cy.get('[aria-label="Resultaat van je actie"] button.dismiss').should('be.visible').click();
        loginAdminFE();
        cy.location('pathname').should('eq', '/beheer');
    });
});
