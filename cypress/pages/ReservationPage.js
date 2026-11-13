export class ReservationsPage {
    root() {
        return cy.get('subox-admin-reservations');
    }
    title() {
        return this.root().find('h2').first();
    }

    searchInput() {
        return this.root().contains('label', 'Zoeken').find('input');
    }

    refreshButton() {
        return this.root().contains('button', 'Lijst vernieuwen');
    }

    reservationButton(reference) {
        return this.root().contains('button.reservation-summary', reference);
    }

    detailTitle() {
        return this.root().find('#reservation-detail-title');
    }

    detailRes(email) {
        return this.root().find('.detail').contains('p', email);
    }

    confirmButton() {
        return this.root().contains('button', 'Bevestigen');
    }

    handoverSectionToggle() {
        return this.root().contains('summary', 'Koffers uitgeven, retour en controle');
    }

    issueButton() {
        return this.root().contains('button', 'Meegeven');
    }

    returnButton() {
        return this.root().contains('button', 'Retour ontvangen');
    }

    inspectionPassedButton() {
        return this.root().contains('button', 'Controle geslaagd');
    }

    finishButton() { 
        return this.root().contains('button', 'Reservering afronden');
    }
}