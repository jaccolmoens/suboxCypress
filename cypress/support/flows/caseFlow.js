export function openCaseFromHomepage(caseData) {
  cy.intercept({
    method: "GET",
    pathname: "/api/public/content",
    times: 1,
  }).as("visitorContent");

  cy.visit("/");

  cy.wait("@visitorContent").its("response.statusCode").should("eq", 200);
  cy.get(`#escape-koffers a[href="/koffers/${caseData.id}"]`)
    .should("exist")
    .scrollIntoView()
    .and("be.visible")
    .click();

  cy.location("pathname").should("eq", `/koffers/${caseData.id}`);
  return cy
    .get("main h1")
    .should("be.visible")
    .and("have.text", caseData.title);
}
