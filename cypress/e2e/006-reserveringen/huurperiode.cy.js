import { viewports } from "../../support/viewports";
import { selectRentalPeriod } from "../../support/flows/reservationFlow";
import { clickNextMonth } from "../../support/flows/reservationFlow";
import { expectCalendarReady } from "../../support/flows/reservationFlow"
const calendar = "subox-availability-calendar";

function navigateToTCSDetailPage() {
  cy.visit("/koffers/the-clockmakers-secret");
  cy.wait("@initialAvailability").its("response.statusCode").should("eq", 200);
  expectCalendarReady();
}



function addRentalDays(dateText, days) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function openWeekendCalendar() {
  cy.intercept({
    method: "GET",
    pathname: "/api/reservations/cases/*/availability",
    times: 1,
  }).as("initialAvailability");

  cy.intercept({
    method: "POST",
    pathname: "/api/reservations/quote",
  }).as("weekendQuote");

  navigateToTCSDetailPage();

  selectRentalPeriod("Weekend");

  clickNextMonth();

  return cy.wait("@monthAvailability").then(({ response }) => {
    expect(response.statusCode).to.equal(200);
    expect(response.body.blockedIntervals).to.be.an("array");

    expectCalendarReady();

    return cy.wrap(response.body.blockedIntervals);
  });
}

describe("CY-006 - Reserveringen", () => {
  it("CY-006-001 - 1 dag huur heeft dezelfde begin- en einddatum",
    viewports.desktop,
    () => {
      let selectedDate;

      cy.intercept({
        method: "GET",
        pathname: "/api/reservations/cases/*/availability",
      }).as("initialAvailability");

      cy.intercept({
        method: "POST",
        pathname: "/api/reservations/quote",
      }).as("rentalQuote");

      navigateToTCSDetailPage();

      selectRentalPeriod("1 dag");

      // Alleen de nieuwe maandlading krijgt deze alias.
      clickNextMonth();

      cy.wait("@monthAvailability").then(({ response }) => {
        expect(response.statusCode).to.equal(200);
        const intervals = response.body.blockedIntervals;
        expect(intervals).to.be.an("array");
        expectCalendarReady();

        cy.get(`${calendar} button.day[data-date]`)
          .should("have.length.greaterThan", 0)
          .then(($days) => {
            const availableDay = Array.from($days).find((day) => {
              const startDate = day.getAttribute("data-date");
              const bufferEnd = new Date(`${startDate}T12:00:00Z`);
              bufferEnd.setUTCDate(bufferEnd.getUTCDate() + 3);
              const endDate = bufferEnd.toISOString().slice(0, 10);

              return (
                !day.disabled &&
                !day.classList.contains("blocked") &&
                !intervals.some(
                  (interval) =>
                    interval.start <= endDate && interval.end >= startDate,
                )
              );
            });

            expect(availableDay, "vrije dag inclusief retour-/controlebuffer")
              .to.exist;
            selectedDate = availableDay.getAttribute("data-date");
            cy.get(`${calendar} button[data-date="${selectedDate}"]`)
              .scrollIntoView()
              .should("be.visible")
              .click();
          });
      });

      // De kalender kan de eerste quote annuleren en vervangen. Wacht daarom
      // eerst op de door de frontend geaccepteerde berekening, niet op request 1.
      cy.contains("button", "Verder met reserveren").should("be.enabled");

      cy.get("@rentalQuote.all").should((interceptions) => {
        const matching = interceptions.filter(
          ({ request }) =>
            request.body.period === "day" &&
            request.body.startDate === selectedDate,
        );
        expect(matching, "berekening voor de gekozen dag").not.to.be.empty;

        // Een geannuleerde eerdere aanvraag mag bestaan; de laatste moet slagen.
        const latest = matching[matching.length - 1];
        expect(latest.error, "laatste berekening heeft geen netwerkfout").not.to
          .exist;
        expect(latest.response, "laatste berekening heeft een antwoord").to
          .exist;
        expect(latest.response.statusCode).to.equal(200);
        expect(latest.response.body.selection.period).to.equal("day");
        expect(latest.response.body.startDate).to.equal(selectedDate);
        expect(latest.response.body.endDate).to.equal(selectedDate);
      });

      cy.then(() => {
        cy.get(`${calendar} button[data-date="${selectedDate}"]`).should(
          "have.attr",
          "aria-pressed",
          "true",
        );

        const displayDate = selectedDate.split("-").reverse().join("-");
        cy.get(".summary-period strong").should("have.text", displayDate);
      });
    },
  );

  it("CY-006-002 - een weekend begint vrijdag en eindigt zondag",
    viewports.desktop,
    () => {
      let fridayDate;
      let sundayDate;

      openWeekendCalendar().then((intervals) => {
        cy.get(`${calendar} button.day[data-date]`)
          .should("have.length.greaterThan", 0)
          .then(($days) => {
            const availableFriday = Array.from($days).find((day) => {
              const start = day.getAttribute("data-date");
              const weekday = new Date(`${start}T12:00:00Z`).getUTCDay();

              // Vrijdag t/m zondag, daarna drie bufferdagen.
              const bufferEnd = addRentalDays(start, 5);

              return (
                weekday === 5 &&
                !day.disabled &&
                !day.classList.contains("blocked") &&
                !intervals.some(
                  (interval) =>
                    interval.start <= bufferEnd && interval.end >= start,
                )
              );
            });

            expect(availableFriday, "vrije vrijdag inclusief weekend en buffer")
              .to.exist;

            fridayDate = availableFriday.getAttribute("data-date");
            sundayDate = addRentalDays(fridayDate, 2);

            cy.get(`${calendar} button[data-date="${fridayDate}"]`)
              .scrollIntoView()
              .should("be.visible")
              .click();
          });
      });

      // Wacht op de door de frontend geaccepteerde berekening.
      cy.contains("button", "Verder met reserveren").should("be.enabled");

      cy.get("@weekendQuote.all").should((interceptions) => {
        const matching = interceptions.filter(
          ({ request }) =>
            request.body.period === "weekend" &&
            request.body.startDate === fridayDate,
        );

        expect(matching, "weekendberekening").not.to.be.empty;

        const latest = matching[matching.length - 1];

        expect(latest.error).not.to.exist;
        expect(latest.response).to.exist;
        expect(latest.response.statusCode).to.equal(200);
        expect(latest.response.body.selection.period).to.equal("weekend");
        expect(latest.response.body.startDate).to.equal(fridayDate);
        expect(latest.response.body.endDate).to.equal(sundayDate);

        const endDay = new Date(
          `${latest.response.body.endDate}T12:00:00Z`,
        ).getUTCDay();

        expect(endDay, "einddatum is zondag").to.equal(0);
      });

      cy.then(() => {
        const displayFriday = fridayDate.split("-").reverse().join("-");
        const displaySunday = sundayDate.split("-").reverse().join("-");

        cy.get(".summary-period strong").should(
          "have.text",
          `${displayFriday} - ${displaySunday}`,
        );

        cy.get(`${calendar} button[data-date="${fridayDate}"]`).should(
          "have.attr",
          "aria-pressed",
          "true",
        );
      });
    },
  );

  it("CY-006-002 - een maandag geeft uitleg zonder verschuiving naar vrijdag",
    viewports.desktop,
    () => {
      let mondayDate;

      openWeekendCalendar();

      cy.get(`${calendar} button.day[data-date]`)
        .should("have.length.greaterThan", 0)
        .then(($days) => {
          const monday = Array.from($days).find((day) => {
            const dateText = day.getAttribute("data-date");
            const weekday = new Date(`${dateText}T12:00:00Z`).getUTCDay();

            return (
              weekday === 1 &&
              !day.disabled &&
              !day.classList.contains("blocked")
            );
          });

          expect(monday, "beschikbare maandag als ongeldige begindag").to.exist;

          mondayDate = monday.getAttribute("data-date");

          cy.get(`${calendar} button[data-date="${mondayDate}"]`)
            .scrollIntoView()
            .should("be.visible")
            .click();
        });

      cy.get("#calendar-error")
        .should("be.visible")
        .and("have.text", "Een weekend begint op vrijdag");

      cy.contains("button", "Verder met reserveren").should("be.disabled");

      cy.then(() => {
        // De aangeklikte maandag blijft geselecteerd.
        cy.get(`${calendar} button[aria-pressed="true"]`)
          .should("have.length", 1)
          .and("have.attr", "data-date", mondayDate);
      });

      cy.get(".summary-period strong").should(
        "have.text",
        "Kies een passende begindatum",
      );

      // Ongeldige invoer wordt al vóór de API-berekening tegengehouden.
      cy.get("@weekendQuote.all").should("have.length", 0);
    },
  );
});
