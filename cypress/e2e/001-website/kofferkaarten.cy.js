import { CaseCard } from "../../components/CaseCard";
import { difficultyLevels } from "../../models/difficultyModel";
import { viewports } from "../../support/viewports";
import { rentalStatuses } from "../../models/rentalStatuses";

describe("001- kofferkaarten", viewports.desktop, () => {
  const card = new CaseCard();

  it("CY-001-017 - toont de juiste kofferinformatie", () => {
    cy.intercept({
      method: "GET",
      pathname: "/api/public/content",
    }).as("publicContent");

    cy.visit("/");

    cy.wait("@publicContent").then(({ response }) => {
      expect(response.statusCode).to.equal(200);
      expect(response.body.cases).to.have.length.greaterThan(0);

      const item = response.body.cases[0];
      cy.log(JSON.stringify(item, null, 2));
      card
        .root(item.id)
        .scrollIntoView()
        .should("be.visible")
        .within(() => {
          cy.get("h3").should("have.text", item.title);

          cy.get(".case-copy > p").should("contain.text", item.description);

          cy.get(".case-meta").within(() => {
            cy.contains(
              "span",
              `${item.minPlayers}–${item.maxPlayers} spelers`,
            ).should("be.visible");

            cy.contains("span", `${item.minimumAge}+ jaar`).should(
              "be.visible",
            );

            cy.contains("span", `${item.durationMinutes} min`).should(
              "be.visible",
            );

            cy.contains("span", item.language).should("be.visible");
          });

          cy.get(".difficulty").should("contain.text", item.difficultyLabel);
        });
    });
  });

  it("CY-001-019 - leeg aanbod toont contact zonder carouselbediening", () => {
    cy.intercept(
      {
        method: "GET",
        pathname: "/api/public/content",
      },
      (request) => {
        request.continue((response) => {
          const originalBody =
            typeof response.body === "string"
              ? JSON.parse(response.body)
              : response.body;

          response.send({
            statusCode: 200,
            body: {
              ...originalBody,
              cases: [],
            },
          });
        });
      },
    ).as("emptyCatalog");

    cy.visit("/");
    cy.wait("@emptyCatalog").then(({ response }) => {
      console.log("Antwoord na aanpassen:", response.body);

      expect(response.statusCode).to.equal(200);
      expect(response.body.cases).to.deep.equal([]);
    });

    cy.contains(
      "#escape-koffers",
      "Er zijn op dit moment geen escape koffers om te bekijken",
    ).should("be.visible");

    cy.get("#escape-koffers").within(() => {
      cy.get("article.case-card").should("not.exist");
      cy.get("subox-carousel").should("not.exist");
    });

    cy.get('#escape-koffers a[href="/contact"]')
      .should("be.visible")
      .and("contain.text", "Neem contact met ons op")
      .click();
  });

  it("CY-001-020 - één koffer blijft bruikbaar zonder navigatieknoppen", () => {
    cy.intercept(
      {
        method: "GET",
        pathname: "/api/public/content",
      },
      (request) => {
        request.continue((response) => {
          const originalBody =
            typeof response.body === "string"
              ? JSON.parse(response.body)
              : response.body;

          expect(originalBody.cases.length).to.be.greaterThan(0);

          response.send({
            statusCode: 200,
            body: {
              ...originalBody,
              cases: [originalBody.cases[0]],
            },
          });
        });
      },
    ).as("singleCatalog");

    cy.visit("/");

    cy.wait("@singleCatalog").then(({ response }) => {
      expect(response.body.cases).to.have.length(1);

      const item = response.body.cases[0];

      cy.get("#escape-koffers article.case-card")
        .should("have.length", 1)
        .scrollIntoView()
        .should("be.visible");

      cy.get("#escape-koffers").within(() => {
        cy.contains("button", "Vorige").should("not.exist");
        cy.contains("button", "Volgende").should("not.exist");
      });
      cy.get(
        '#escape-koffers button[aria-label="Vorige Escape koffers"]',
      ).should("not.exist");

      cy.get(
        '#escape-koffers button[aria-label="Volgende Escape koffers"]',
      ).should("not.exist");

      cy.get(`#escape-koffers a[href="/koffers/${item.id}"]`)
        .should("be.visible")
        .click();

      cy.location("pathname").should("eq", `/koffers/${item.id}`);

      cy.get("main h1").should("be.visible").and("have.text", item.title);
    });
  });

  difficultyLevels.forEach(({ label, signs }) => {
    it(`CY-001-023 - ${label} toont ${signs} escape signs en leesbare tekst`, () => {
      cy.intercept(
        {
          method: "GET",
          pathname: "/api/public/content",
        },
        (request) => {
          request.continue((response) => {
            expect(response.statusCode).to.equal(200);

            const originalBody =
              typeof response.body === "string"
                ? JSON.parse(response.body)
                : response.body;

            expect(
              originalBody.cases,
              "minstens één beschikbare testkoffer",
            ).to.be.an("array").and.not.be.empty;

            const testCase = {
              ...originalBody.cases[0],
              difficultyLabel: label,
            };

            response.send({
              statusCode: 200,
              body: {
                ...originalBody,
                cases: [testCase],
              },
            });
          });
        },
      ).as("difficultyCatalog");

      cy.visit("/");

      cy.wait("@difficultyCatalog").then(({ response }) => {
        expect(response.statusCode).to.equal(200);
        expect(response.body.cases).to.have.length(1);

        const item = response.body.cases[0];

        expect(item.difficultyLabel).to.equal(label);

        card.root(item.id).scrollIntoView().should("be.visible");

        card.root(item.id).within(() => {
          cy.get(".difficulty > span:last-child")
            .should("be.visible")
            .and("have.text", label);
          cy.get(".difficulty-icon").should(($icons) => {
            expect($icons).to.have.length(signs);
            $icons.each((index, image) => {
              expect(Cypress.$(image), `escape sign ${index + 1} is zichtbaar`)
                .to.be.visible;

              expect(
                image.complete,
                `escape sign ${index + 1} is geladen`,
              ).to.equal(true);

              expect(
                image.naturalWidth,
                `escape sign ${index + 1} bevat een afbeelding`,
              ).to.be.greaterThan(0);
            });
          });
        });
      });
    });
  });

  rentalStatuses.forEach((rentalStatus) => {
    it(`CY-001-025 - verhuurstatus ${rentalStatus} staat linksboven los van publicatiestatus`, () => {
      cy.intercept(
        {
          method: "GET",
          pathname: "/api/public/content",
        },
        (request) => {
          request.continue((response) => {
            expect(response.statusCode).to.equal(200);

            const originalBody =
              typeof response.body === "string"
                ? JSON.parse(response.body)
                : response.body;

            expect(originalBody.cases).to.be.an("array").and.not.be.empty;

            const testCase = {
              ...originalBody.cases[0],
              status: "published",
              rentalStatus,
            };

            response.send({
              statusCode: 200,
              body: {
                ...originalBody,
                cases: [testCase],
              },
            });
          });
        },
      ).as("rentalStatusCatalog");

      cy.visit("/");

      cy.wait("@rentalStatusCatalog").then(({ response }) => {
        expect(response.body.cases).to.have.length(1);

        const item = response.body.cases[0];

        expect(item.status).to.equal("published");
        expect(item.rentalStatus).to.equal(rentalStatus);

        card.root(item.id).scrollIntoView().should("be.visible");

card.root(item.id).should(($card) => {
    expect(
        $card.find('.case-copy .draft-label').text()
    ).not.to.contain('Voorbeeldkoffer');
});
card.root(item.id)
    .find('.case-top .draft-label')
    .should('have.length', 1)
    .and('be.visible')
    .and('have.text', rentalStatus);
        card.root(item.id).should(($card) => {
          const cardBounds = $card[0].getBoundingClientRect();

          const label = $card.find(".case-top .draft-label");
          expect(label).to.have.length(1);

          const labelBounds = label[0].getBoundingClientRect();

          const relativeLeft = labelBounds.left - cardBounds.left;

          const relativeTop = labelBounds.top - cardBounds.top;

          expect(relativeLeft, "label binnen de linkerrand").to.be.at.least(0);

          expect(relativeTop, "label binnen de bovenrand").to.be.at.least(0);

          expect(labelBounds.right, "label binnen de kaart").to.be.at.most(
            cardBounds.right,
          );

          expect(
            relativeLeft,
            "label begint in het linker kwart",
          ).to.be.lessThan(cardBounds.width / 4);

          expect(
            relativeTop,
            "label begint in het bovenste kwart",
          ).to.be.lessThan(cardBounds.height / 4);
        });
      });
    });
  });
});
