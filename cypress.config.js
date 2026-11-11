const { defineConfig } = require("cypress");
module.exports = defineConfig({
  e2e: {
    viewportWidth: 1280,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      return config;
    },
    baseUrl: "http://localhost:4200/",
  },
});
