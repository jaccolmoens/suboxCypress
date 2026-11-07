import { loginAdmin, logoutAdmin } from "../../support/api/authApi";
import { createCaseData } from "../../models/caseModel";
import {
  createCase,
  deleteCase,
  getPublicContent,
  updateCase,
} from "../../support/api/casesApi";

describe("001 - kofferpublicatie", () => {
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

  it("CY-001-018 - conceptkoffers blijven buiten het publieke aanbod", () => {
    const concept = createCaseData({
      title: "Concept dat bezoekers niet mogen zien",
    });

    cy.visit("/");

    loginAdmin().its("status").should("eq", 200);

    createCase(concept).then((response) => {
      if (response.status === 201) {
        createdCase = response.body;
      }

      expect(response.status).to.equal(201);
      expect(response.body.payload.status).to.equal("draft");
      expect(response.body.id).to.equal(concept.id);
    });

    logoutAdmin().its("status").should("eq", 204);

    cy.intercept({
      method: "GET",
      pathname: "/api/public/content",
    }).as("visitorContent");

    cy.visit("/", {
      onBeforeLoad(win) {
        cy.spy(win, "fetch").as("visitorFetch");
      },
    });

    cy.get("@visitorFetch").should((fetchSpy) => {
      const urls = fetchSpy.getCalls().map((call) => {
        const input = call.args[0];

        return typeof input === "string" ? input : input.url;
      });

      expect(
        urls.some((url) => url.includes("/api/public/content")),
        "bezoekerspagina vraagt publieke inhoud op",
      ).to.equal(true);
    });

    cy.wait("@visitorContent").then(({ response }) => {
      cy.get("#escape-koffers article.case-card").should(
        "have.length",
        response.body.cases.length,
      );
      expect(response.statusCode).to.equal(200);
      expect(response.body.cases).to.be.an("array");

      const publicIds = response.body.cases.map((item) => item.id);

      expect(publicIds, "publiek aangeboden koffer-IDs").not.to.include(
        concept.id,
      );
    });

    cy.get("#escape-koffers").should("be.visible");

    cy.get(`#escape-koffers a[href="/koffers/${concept.id}"]`).should(
      "not.exist",
    );
  });

  it("CY-001-021 - Publicatie verschijnt binnen vijf seconden bij een nieuwe pagina lading zonder build", () => {
    const concept = createCaseData({
      title: "nieuwe publicatie zonder build",
    });

    let loadStartedAt;

    cy.visit("/");
    loginAdmin().its("status").should("eq", 200);

    createCase(concept).then((response) => {
      if (response.status === 201) {
        createdCase = response.body;
      }

      expect(response.status).to.equal(201);
      expect(response.body.payload.status).to.equal("draft");
    });

    getPublicContent().then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body.cases).to.be.an("array");

      const ids = response.body.cases.map((item) => item.id);

      expect(ids).not.to.include(concept.id);
    });
    cy.then(() => {
      return updateCase(createdCase.recordId, createdCase.version, {
        ...concept,
        status: "published",
      });
    }).then((response) => {
      if (response.status === 200) {
        createdCase = response.body;
      }

      expect(response.status).to.equal(200);
      expect(response.body.payload.status).to.equal("published");
    });

    logoutAdmin().its("status").should("eq", 204);

    cy.intercept({
      method: "GET",
      pathname: "/api/public/content",
    }).as("publishedContent");

    cy.then(() => {
      loadStartedAt = Date.now();
    });

    cy.visit("/", { timeout: 5000 });

    cy.wait("@publishedContent", {
      requestTimeout: 5000,
      responseTimeout: 5000,
    }).then(({ response }) => {
      expect(response.statusCode).to.equal(200);

      const ids = response.body.cases.map((item) => item.id);

      expect(ids).to.include(concept.id);
    });

    cy.get(`#escape-koffers a[href="/koffers/${concept.id}"]`, {
      timeout: 5000,
    }).should(($link) => {
      expect($link).to.have.length(1);

      expect($link.find("h3").text()).to.equal(concept.title);

      expect(
        Date.now() - loadStartedAt,
        "tijd vanaf paginalading tot weergegeven kaart",
      ).to.be.at.most(5000);
    });
  });

  it("CY-001-022 - Ingetrokken koffer verdwijnt online en bliijft via de oude URL onbeschikbaar", () => {
    const published = createCaseData({
      status: "published",
      title: "koffer die wordt ingetrokken",
    });

    const detailPath = `/koffers/${published.id}`;

    cy.visit("/");
    loginAdmin().its("status").should("eq", 200);

    createCase(published).then((response) => {
      if (response.status === 201) {
        createdCase = response.body;
      }

      expect(response.status).to.equal(201);
      expect(response.body.payload.status).to.equal("published");
    });

    logoutAdmin().its("status").should("eq", 204);

    cy.intercept({
      method: "GET",
      pathname: "/api/public/content",
      times: 1,
    }).as("beforeWithdrawal");

    cy.visit(detailPath);
    cy.wait("@beforeWithdrawal");

    cy.get("main h1").should("be.visible").and("have.text", published.title);

    loginAdmin().its("status").should("eq", 200);

    cy.then(() => {
      return updateCase(createdCase.recordId, createdCase.version, {
        ...published,
        status: "draft",
      });
    }).then((response) => {
      if (response.status === 200) {
        createdCase = response.body;
      }

      expect(response.status).to.equal(200);
      expect(response.body.payload.status).to.equal("draft");
    });

    logoutAdmin().its("status").should("eq", 204);

    cy.intercept({
      method: "GET",
      pathname: "/api/public/content",
          times: 1,
    }).as("afterWithdrawal");

    cy.visit("/", {
      onBeforeLoad(win) {
        cy.spy(win, "fetch").as("homeFetch");
      },
    });

    cy.get("@homeFetch").should((fetchSpy) => {
      const urls = fetchSpy.getCalls().map((call) => {
        const input = call.args[0];

        return typeof input === "string" ? input : input.url;
      });

      expect(
        urls.some((url) => url.includes("/api/public/content")),
        "homepage vraagt publieke inhoud op",
      ).to.equal(true);
    });

    cy.wait("@afterWithdrawal").then(({ response }) => {
      expect(response.statusCode).to.equal(200);
      expect(response.body.cases).to.be.an("array");

      const ids = response.body.cases.map((item) => item.id);

      expect(ids).not.to.include(published.id);

      if (response.body.cases.length === 0) {
        cy.contains(
          "#escape-koffers",
          "Er zijn op dit moment geen escape koffers om te bekijken.",
        ).should("be.visible");
      } else {
        cy.get("#escape-koffers article.case-card").should(
          "have.length",
          response.body.cases.length,
        );
      }
    });

    cy.get(`#escape-koffers a[href="${detailPath}"]`).should("not.exist");

    cy.intercept({
      method: "GET",
      pathname: "/api/public/content",
          times: 1,
    }).as("withdrawnDetail");

    cy.visit(detailPath, { failOnStatusCode: false });
cy.location('pathname').should('eq', detailPath);
    cy.wait("@withdrawnDetail").then(({ response }) => {
      expect(response.statusCode).to.equal(200);

      const ids = response.body.cases.map((item) => item.id);

      expect(ids).not.to.include(published.id);
    });

    cy.get("main").then(($main) => {
      console.log("Detaildiagnose:", {
        heading: $main.find("h1").text(),
        notice: $main.find(".detail-notice").text(),
      });
    });

    cy.get("main h1")
      .should("be.visible")
      .and("have.text", "Deze koffer is niet beschikbaar");

    cy.get("#case-title").should("not.exist");
  });
});
