export class CaseCard {
    root(caseId) {
        return cy
            .get(`#escape-koffers a[href="/koffers/${caseId}"]`)
            .closest('article.case-card');
    }
}