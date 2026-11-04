describe("001 - Publieke informatiepaginas", () => {
  const pages = [
    {
      name: "huuruitleg",
      path: "/uitleg",
      heading: "Een groot avontuur. In een kleine koffer.",
    },
    {
      name: "over-ons",
      path: "/over-ons",
      heading: "Van Retailer naar ICT\ér met als hobbie.... avonturier\!",
    },
    {
      name: "contact",
      path: "/contact",
      heading: "Vertel ons overjullie avontuur.",
    },
    {
      name: "algemene-voorwaarden",
      path: "/algemene-voorwaarden",
      heading: "Algemene huurvoorwaarden",
    },
    {
      name: "cookies",
      path: "/cookies",
      heading: "Cookies",
    },
    {
      name: "privacy",
      path: "/privacy",
      heading: "Privacy",
    },
  ];

  pages.forEach((page) => {
    it(`CY-001-002 - ${page.name} is rechtstreeks en na vernieuwen bereikbaar`, () => {
      cy.visit(page.path);
      cy.get("main h1")
        .should("have.length", 1)
        .and("be.visible")
        .and("have.text", page.heading);
      cy.reload();
      cy.get("main h1")
        .should("have.length", 1)
        .and("be.visible")
        .and("have.text", page.heading);
    });
  });
});
