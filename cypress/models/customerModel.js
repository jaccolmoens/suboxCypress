export function createCustomer(overrides = {}){
    return {
        firstName: 'Cypress',
        middleName: 'test',
        lastName: 'Automation',
        email: 'cypress@example.com',
        phone: '0123456789',
        addressStreet: 'CYStraat',
        addressNumber: '42',
        addressPostalcode: '1234AB',
        addressCity: 'Cypress Hill',
        addressCountry: 'NL',
        business: false,
        companyName: 'CypressIncorporated',
        companyPhone: '0301234567',
        ...overrides,
    }
}