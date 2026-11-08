import { carousels } from "../../models/carousels";
import { viewports } from "../../support/viewports";
import "cypress-real-events";

// Controleer zowel de uitlijning als de zichtbaarheid van een kaart.
function expectCardInView(carouselSelector, index) {
  return cy
    .get(carouselSelector)
    .find('.track [role="listitem"]')
    .eq(index)
    .should(($card) => {
      const trackElement = $card.closest(".track")[0];
      const track = trackElement.getBoundingClientRect();
      const card = $card[0].getBoundingClientRect();

      const viewportLeft = track.left + trackElement.clientLeft;
      const viewportRight = viewportLeft + trackElement.clientWidth;

      const cardOffset = card.left - viewportLeft + trackElement.scrollLeft;

      const expectedScroll = Math.min(
        cardOffset,
        trackElement.scrollWidth - trackElement.clientWidth,
      );

      expect(
        trackElement.scrollLeft,
        `kaart ${index + 1}: uitlijning`,
      ).to.be.closeTo(expectedScroll, 0.5);

      expect(card.left, `kaart ${index + 1}: linkerkant`).to.be.at.least(
        viewportLeft - 2,
      );

      expect(card.right, `kaart ${index + 1}: rechterkant`).to.be.at.most(
        viewportRight + 2,
      );
    });
}

function openCarouselPage() {
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

        expect(originalBody.reviews, "basisreview voor de testdata").to.be.an(
          "array",
        ).and.not.be.empty;

        const reviews = [1, 2, 3].map((number) => ({
          ...originalBody.reviews[0],
          id: `cy-review-${number}`,
          text: `Fictieve carouselreview ${number}.`,
          authorDisplayName: `Testpersoon ${number}`,
          isExample: true,
        }));

        response.send({
          statusCode: 200,
          body: {
            ...originalBody,
            reviews,
          },
        });
      });
    },
  ).as("publicContent");

  cy.visit("/");

  cy.wait("@publicContent").then(({ response }) => {
    expect(response.statusCode).to.equal(200);
  });
}

describe("001 - Carousels", viewports.mobile, () => {
  carousels.forEach((carousel) => {
    ["knoppen", "toetsenbord"].forEach((control) => {
      it(`CY-001-027 - ${carousel}: alle kaarten bereikbaar via ${control}`, () => {
        openCarouselPage();
        const region = `[role="region"][aria-label="${carousel}"]`;

        cy.get(region).scrollIntoView().should("be.visible");

        cy.get(region)
          .find('.track [role="listitem"]')
          .its("length")
          .should("be.at.least", 2);

        // Meerdere kaarten moeten ook echt overflow opleveren.
        cy.get(region)
          .find(".track")
          .should(($track) => {
            const track = $track[0];

            expect(
              track.scrollWidth,
              "lijst is breder dan het zichtbare gedeelte",
            ).to.be.greaterThan(track.clientWidth + 2);
          });

        if (control === "toetsenbord") {
          cy.get(region).find(".track").focus().should("be.focused");
        }

        cy.get(region)
          .find('.track [role="listitem"]')
          .each(($item, index) => {
            if (index > 0) {
              if (control === "knoppen") {
                cy.get(region)
                  .find(`button[aria-label="Volgende ${carousel}"]`)
                  .should("be.visible")
                  .and("be.enabled")
                  .click();
              } else {
                cy.get(region).find(".track").should("be.focused");

                cy.press(Cypress.Keyboard.Keys.RIGHT);
              }
            }

            // Wacht op de eindpositie vóór de volgende actie.
            return expectCardInView(region, index);
          });
      });
    });

    it(`CY-001-028 - ${carousel} heeft bij Vorige en Volgende de juiste grensstatus teruggaan bereikt de eerste kaart`, () => {
      openCarouselPage();

      const previeButton = `[role="region"][aria-label="${carousel}"] button[aria-label="Vorige ${carousel}"]`;
      const nextButton = `[role="region"][aria-label="${carousel}"] button[aria-label="Volgende ${carousel}"]`;

      cy.get(previeButton)
        .scrollIntoView()
        .should("be.visible")
        .and("be.disabled");
      cy.get(nextButton)
        .scrollIntoView()
        .should("be.visible")
        .and("be.enabled");

      const region = `[role="region"][aria-label="${carousel}"]`;

      cy.get(region)
        .find('.track [role="listitem"]')
        .each(($item, index) => {
          if (index > 0) {
            cy.get(nextButton).should("be.visible").and("be.enabled").click();
          }

          return expectCardInView(region, index);
        });
      cy.get(nextButton).should("be.visible").and("be.disabled");
      cy.get(previeButton).should("be.visible").and("be.enabled");

      cy.get(region)
        .find('.track [role="listitem"]')
        .its("length")
        .then((count) => {
          for (let step = 0; step < count - 1; step++) {
            const targetIndex = count - 2 - step;

            cy.get(previeButton).should("be.enabled").click();
            expectCardInView(region, targetIndex);
          }
        });

      cy.get(nextButton).should("be.visible").and("be.enabled");
      cy.get(previeButton).should("be.visible").and("be.disabled");
    });
  });

  it("CY-001-029 - muisslepen navigeert niet; een volgende klik opent de koffer",
    viewports.desktop,
    () => {
      openCarouselPage();
      const region = '[role="region"][aria-label="Escape koffers"]';
      const trackSelector = `${region} .track`;
      let startScroll;

      cy.get(trackSelector).should(($track) => {
        expect($track[0].scrollWidth).to.be.greaterThan($track[0].clientWidth);
      });

      // Plaats de lijst direct onder het vaste menu, zonder scrollanimatie.
      cy.get(trackSelector).then(($track) => {
        const track = $track[0];
        const win = track.ownerDocument.defaultView;
        win.scrollTo({
          top: win.scrollY + track.getBoundingClientRect().top - 180,
          behavior: 'instant',
        });
      });

      cy.get(trackSelector).should(($track) => {
        const bounds = $track[0].getBoundingClientRect();
        const win = $track[0].ownerDocument.defaultView;
        expect(bounds.top).to.be.at.least(0);
        expect(bounds.top + 100).to.be.lessThan(win.innerHeight);
      }).then(($track) => {
        const track = $track[0];
        startScroll = track.scrollLeft;
        const startX = track.clientWidth * 0.8;
        const endX = track.clientWidth * 0.2;
        const y = 100;

        cy.wrap($track).realMouseDown({
          button: 'left', x: startX, y, scrollBehavior: false,
        });
        cy.wrap($track).realMouseMove(endX, y, {
          position: 'topLeft', keepMouseDownButton: 'left', scrollBehavior: false,
        });
        cy.get(trackSelector).should('have.class', 'dragging');
        cy.wrap($track).realMouseUp({
          button: 'left', x: endX, y, scrollBehavior: false,
        });
      });

      // Wacht op de uitlijning na loslaten; verander de scrollpositie niet zelf.
      cy.get(trackSelector).should(($track) => {
        const track = $track[0];
        expect($track).not.to.have.class('dragging');
        expect(track.scrollLeft).to.be.greaterThan(startScroll + 10);
        const origin = track.getBoundingClientRect().left + track.clientLeft;
        const max = track.scrollWidth - track.clientWidth;
        const stops = [0, max, ...Array.from(track.children).map((child) =>
          Math.min(max, child.getBoundingClientRect().left - origin + track.scrollLeft)
        )];
        expect(Math.min(...stops.map((stop) => Math.abs(stop - track.scrollLeft))))
          .to.be.lessThan(0.5);
      });
      cy.location('pathname').should('eq', '/');

      // Kies een kaart die al volledig in beeld staat voor de gewone klik.
      cy.get(trackSelector).then(($track) => {
        const bounds = $track[0].getBoundingClientRect();
        const link = Array.from($track[0].querySelectorAll('a.case-link')).find((item) => {
          const rect = item.getBoundingClientRect();
          return rect.left >= bounds.left - 2 && rect.right <= bounds.right + 2;
        });
        expect(link, 'volledig zichtbare kofferlink').to.exist;
        const href = link.getAttribute('href');
        const title = link.querySelector('h3').textContent.trim();

        cy.get(region).find(`a[href="${href}"]`)
          .realClick({ scrollBehavior: false });
        cy.location('pathname').should('eq', href);
        cy.get('main h1#case-title').should('be.visible').and('have.text', title);
      });
    },
  );
});
