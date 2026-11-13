export function selectRentalPeriod(label) {
  return cy
    .contains(".period-options label", label)
    .scrollIntoView()
    .should("be.visible")
    .find('input[type="radio"]')
    .check()
    .should("be.checked");
}

export function clickNextMonth() {
  cy.intercept({
    method: "GET",
    pathname: "/api/reservations/cases/*/availability",
  }).as("monthAvailability");

  return cy
    .get('button[aria-label="Volgende maand"]')
    .should("be.visible")
    .and("be.enabled")
    .click();
}

export function expectCalendarReady() {
  return cy.get('.calendar-column > p[role="status"]').should("not.exist");
}

export function fillCustomerForm(customer) {
    fillTextField("#firstName", customer.firstName);
    fillTextField('#middleName', customer.middleName);
    fillTextField('#lastName', customer.lastName);
    fillTextField('#email', customer.email); 
    fillTextField('#phone', customer.phone);
    fillTextField('#address-street', customer.addressStreet);
    fillTextField('#address-number', customer.addressNumber);
    fillTextField('#address-postalCode', customer.addressPostalcode);
    fillTextField('#address-city', customer.addressCity);
    fillTextField('#address-country', customer.addressCountry);

    cy.get('input[name="business"]')
    .eq(customer.business ? 1 : 0)
    .check()
    .should('be.checked');

    if(customer.business === true){
    fillTextField('[name="companyName"]', customer.companyName);
    fillTextField('[name="companyPhone"]', customer.companyPhone);
    }
}

function fillTextField(selector, value) {
  cy.get(selector)
    .should("be.enabled")
    .clear()
    .scrollIntoView()
    .should("be.visible");

  if (value !== "") {
    cy.get(selector).type(value);
  }

  cy.get(selector).should("have.value", value);
}

//#region buttons

export function reservationButtonIsReady() {
  return cy
    .get("button.continue-button")
    .should("be.visible")
    .and("be.enabled");
}

export function reservationApplicationButtonReady() {
    return cy.get('button[type="submit"]')
    .should('be.visible')
    .and('be.enabled');
}

export function checkVoorwaardenCheckbox() {
    return cy
    .get('.review-panel input[type="checkbox"]')
    .should('be.visible')
    .check()
    .should('be.checked');
}

export function reservationReadyButtonIsReady() {
    return cy
    .contains('.review-panel button', 'Reservering aanvragen')
    .should('be.visible')
    .and('be.enabled');
}

//#endregion
