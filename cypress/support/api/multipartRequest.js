export function multipartRequest({
  method = "POST",
  path,
  fields = {},
  files = [],
  headers = {},
}) {
  const uploads = [];

  return cy
    .wrap(files, { log: false })
    .each((file) => {
      return cy.fixture(file.fixture, "base64").then((base64) => {
        uploads.push({
          ...file,
          blob: Cypress.Blob.base64StringToBlob(base64, file.mimeType),
        });
      });
    })
    .then(() => {
      return cy.window().then(async (win) => {
        const origin = new URL(Cypress.config("baseUrl")).origin;

        if (win.location.origin !== origin) {
          throw new Error(
            "Open eerst een pagina van de website met cy.visit().",
          );
        }

        const formData = new win.FormData();

        Object.entries(fields).forEach(([name, value]) => {
          formData.append(name, value);
        });

        uploads.forEach((file) => {
          formData.append(file.field, file.blob, file.filename);
        });

        const response = await win.fetch(`${origin}/api${path}`, {
          method,
          credentials: "same-origin",
          headers: {
            "X-Subox-Admin": "1",
            "Idempotency-Key": win.crypto.randomUUID(),
            "ngsw-bypass": "1",
            ...headers,
          },
          body: formData,
          cache: "no-store",
        });
        console.log("Uploadresponse:", {
          status: response.status,
          url: response.url,
          redirected: response.redirected,
          contentType: response.headers.get("content-type"),
        });
        const text = await response.text();

        console.log("Uploadbody:", text);
        console.log("Aantal tekens:", text.length);

        const body = text.trim() ? JSON.parse(text) : null;

        return {
          status: response.status,
          body,
        };
      });
    });
}
