export function loginAdminFE() {
  return cy
    .env(["adminUsername", "adminPassword"])
    .then(({ adminUsername, adminPassword }) => {
      if (
        typeof adminUsername !== "string" ||
        !adminUsername.trim() ||
        typeof adminPassword !== "string" ||
        !adminPassword
      ) {
        throw new Error("Stel adminUsername en adminPassword in.");
      }
      cy.visit("/login");
      cy.location("pathname").should("eq", "/login");

      cy.get("main h1").should("be.visible").and("have.text", "Inloggen");
      cy.get(".info-page").find("#username").should("be.visible");
      cy.get(".info-page").find("#password").should("be.visible");

      cy.get("main #username").should("be.visible").type(adminUsername, {log:false});
      cy.get("main #password").should("be.visible").type(adminPassword, {log:false});
            cy.get('button[type="submit"].button').click();

            
    })
}
