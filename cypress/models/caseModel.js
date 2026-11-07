export function createCaseData(overrides = {}) {
    return{
        id: `cy-koffer-${crypto.randomUUID()}`,
        status: 'draft',
        title: 'Cypress testkoffer',
        description: 'Cypress test koffer',
        difficultyLabel: 'heel makkelijk',
        minPlayers: 2,
        maxPlayers: 5,
        minimumAge: 12,
        durationMinutes: 60,
        rentalStatus: 'beschikbaar',
        neverSolved: false,
        language: 'Nederlands',
        alt: 'Afbeelding van een fictieve testkoffer',
        ...overrides,
    };
}