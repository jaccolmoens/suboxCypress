# Subox Cypress

End-to-end-tests voor de Subox-website met Cypress.

## Starten

Installeer Node.js en voer vanuit deze map uit:

```sh
npm ci
npx cypress open
```

Kies E2E Testing en een browser. De tests staan in `cypress/e2e`.
Zorg dat de website bereikbaar is op de URL die de test gebruikt.

Tests uitvoeren zonder de interactieve Cypress-app:

```sh
npx cypress run
```

Bewaar wachtwoorden en tokens niet in Git. `cypress.env.json` en `.env`-bestanden worden genegeerd.
