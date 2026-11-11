export function createRentalProfileData(overrides = {}) {
    return{
        enabled: true,
        dayCents: 1500,
        weekendCents: 2500,
        midweekCents: 3000,
        weekCents: 5000,
        depositCents: 2500, 
        ...overrides,
    };
}