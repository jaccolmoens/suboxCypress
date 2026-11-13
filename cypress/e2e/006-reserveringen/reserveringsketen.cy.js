import { createCaseData } from "../../models/caseModel";
import { viewports } from "../../support/viewports";
import { loginAdmin, logoutAdmin } from "../../support/api/authApi";
import { createCase, deleteCase } from "../../support/api/casesApi";
import { createRentalProfileData } from "../../models/rentalProfileModel";
import { openCaseFromHomepage } from "../../support/flows/caseFlow";
import { configureRentalProfile } from "../../support/flows/rentalProfileFlow";
import { createCustomer } from "../../models/customerModel";
import { loginAdminFE } from "../../support/login";
import { AdminPAge } from "../../pages/AdminPage";
import { ReservationsPage } from "../../pages/ReservationPage";
import { getReservations } from "../../support/api/reservationsAPI";
import {
  selectRentalPeriod,
  clickNextMonth,
  expectCalendarReady,
  reservationButtonIsReady,
  reservationApplicationButtonReady,
  reservationReadyButtonIsReady,
  checkVoorwaardenCheckbox,
  fillCustomerForm,
} from "../../support/flows/reservationFlow";
import { cleanupReservation } from "../../support/flows/reservationCleanupFlow";

describe("CY-006 reserverings keten tests", viewports.desktop, () => {
  let createdCase;
  let reservationReference;
  const admin = new AdminPAge();
  const resPage = new ReservationsPage();

  beforeEach(() => {
    createdCase = undefined;
    reservationReference = undefined;
  });

  afterEach(() => {
    if (!createdCase) {
      return;
    }
    loginAdmin().its("status").should("eq", 200);
    if (reservationReference) {
      getReservations(reservationReference).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.items).to.be.an("array");

        const reservation = response.body.items.find((item) => {
          return item.reference === reservationReference;
        });
        expect(reservation).to.exist;

        return cleanupReservation(reservation.id);
      });
    }
    deleteCase(createdCase.recordId, createdCase.version)
      .its("status")
      .should("eq", 200);
  });

  it("CY-006 - volledige reserveringsketen met één koffer Happy flow", () => {
    const CYTestCase = createCaseData({
      status: "published",
      title: "Cypress test koffertje",
    });
    cy.visit("/");

    const customer = createCustomer();
    loginAdmin().its("status").should("eq", 200);
    createCase(CYTestCase).then((response) => {
      if (response.status === 201) {
        createdCase = response.body;
      }

      expect(response.status).to.equal(201);
      expect(response.body.payload.status).to.equal("published");
      expect(response.body.payload.id).to.equal(CYTestCase.id);

      configureRentalProfile(createdCase.recordId, createRentalProfileData());
    });
    logoutAdmin().its("status").should("eq", 204);
    openCaseFromHomepage(CYTestCase);
    selectRentalPeriod("1 dag");
    clickNextMonth();

    cy.get("@monthAvailability.all")
      .should((requests) => {
        expect(requests, "beschikbaarheidsverzoeken").not.to.be.empty;

        const latest = requests[requests.length - 1];
        expect(latest.response, "laatste verzoek heeft antwoord").to.exist;
        expect(latest.response.statusCode).to.equal(200);
        expect(latest.response.body.blockedIntervals).to.be.an("array");
      })
      .then(() => {
        expectCalendarReady();

        cy.get("subox-availability-calendar")
          .find("button.day[data-date]")
          .then(($days) => {
            cy.log($days.length);
            const availableDay = Array.from($days).find((day) => {
              return !day.disabled && !day.classList.contains("blocked");
            });
            expect(availableDay).to.exist;
            const selectedDate = availableDay.getAttribute("data-date");
            cy.log(selectedDate);
            cy.get(
              `subox-availability-calendar button.day[data-date="${selectedDate}"]`,
            )
              .scrollIntoView()
              .should("be.visible")
              .click();

            cy.get(
              `subox-availability-calendar button.day[data-date="${selectedDate}"]`,
            ).should("have.attr", "aria-pressed", "true");
          });
      });
    reservationButtonIsReady().click();
    cy.location("pathname").should("eq", "/reserveren");

    fillCustomerForm(customer);
    reservationApplicationButtonReady().click();
    cy.location("pathname").should("eq", "/reserveren/controleren");
    cy.get("main h1")
      .should("be.visible")
      .and("contain.text", "Aanvraag controleren");

    cy.get(".review-panel").should("contain.text", customer.email);

    cy.intercept({
      method: "POST",
      pathname: "/api/reservations/requests",
    }).as("createReservation");

    checkVoorwaardenCheckbox();
    reservationReadyButtonIsReady().click();

    cy.wait("@createReservation").then(({ response }) => {
      reservationReference = response.body.reference;
      expect(response.statusCode).to.equal(201);
      expect(reservationReference).to.be.a("string").and.not.be.empty;
      cy.get("main h1")
        .should("be.visible")
        .and("contain.text", "Aanvraag ontvangen");
      cy.get(".receipt-content")
        .should("be.visible")
        .and("contain.text", reservationReference);
    });

    loginAdminFE();
    cy.location("pathname").should("eq", "/beheer");

    admin.reservationsButton().should("be.visible").click();
    resPage
      .title()
      .should("be.visible")
      .and("contain.text", "Reserveringen")
      .then(() => {
        resPage.searchInput().clear().type(reservationReference);
        resPage.refreshButton().click();
        resPage
          .reservationButton(reservationReference)
          .should("be.visible")
          .and("contain.text", "Aangevraagd")
          .click();
        resPage
          .detailTitle()
          .should("be.visible")
          .and("contain.text", reservationReference);

        resPage.detailRes(customer.email).should("be.visible");

        cy.intercept({
          method: "POST",
          pathname: `/api/admin/reservations/*/confirm`,
        }).as("confirmedReservation");
        resPage.confirmButton().should("be.visible").and("be.enabled").click();
      });

    cy.wait("@confirmedReservation").then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });
    resPage.detailTitle().should("be.visible").and("contain.text", "Bevestigd");
    resPage.handoverSectionToggle().should("be.visible").click();
    resPage
      .handoverSectionToggle()
      .parent("details")
      .should("have.attr", "open");

    cy.intercept({
      method: "POST",
      pathname: "/api/admin/reservations/*/lines/*/issue",
    }).as("issueReservation");

    resPage.issueButton().should("be.visible").and("be.enabled").click();

    cy.wait("@issueReservation").then(({ response }) => {
      expect(response.statusCode).to.equal(200);
      resPage.detailTitle().should("contain.text", "Meegegeven");
    });

    cy.intercept({
      method: "POST",
      pathname: "/api/admin/reservations/*/lines/*/return",
    }).as("returnReservation");

    resPage.returnButton().should("be.visible").and("be.enabled").click();

    cy.wait("@returnReservation").then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });

    resPage.detailTitle().should("contain.text", "Retour ontvangen");

    cy.intercept({
      method: 'POST',
      pathname: "/api/admin/reservations/*/lines/*/inspect",
    }).as('inspectReservation');

    resPage.inspectionPassedButton().should('be.visible').and('be.enabled').click();

    cy.wait('@inspectReservation').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    })
    
    resPage.inspectionPassedButton().should('be.visible').and('be.disabled');

    cy.intercept({
      method: 'POST',
      pathname: '/api/admin/reservations/*/finish',
    }).as('finishReservation');

    resPage.finishButton().should('be.visible').and('be.enabled').click();

    cy.wait('@finishReservation').then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    })

    resPage.detailTitle().should('contain.text', 'Afgerond');
  });
});
