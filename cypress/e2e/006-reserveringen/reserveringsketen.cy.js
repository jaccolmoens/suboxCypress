import { createCaseData } from "../../models/caseModel";
import { viewports } from "../../support/viewports";
import { loginAdmin, logoutAdmin } from "../../support/api/authApi";
import { createCase, deleteCase } from "../../support/api/casesApi";
import { createRentalProfileData } from "../../models/rentalProfileModel";
import { openCaseFromHomepage } from "../../support/flows/caseFlow";
import { configureRentalProfile } from "../../support/flows/rentalProfileFlow";

describe("CY-006 reserverings keten tests", viewports.desktop, () => {
  let createdCase;

  beforeEach(() => {
    createdCase = undefined;
  });

  afterEach(() => {
    if (!createdCase) {
      return;
    }
    loginAdmin().its("status").should("eq", 200);
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
  });
});
