export function apiRequest({
    method = 'GET',
    path, 
    headers = {},
    ...options
}) {
    const origin = new URL(Cypress.config('baseUrl')).origin;

    return cy.request({
        ...options,
        method, 
        url: `${origin}/api${path}`,
        headers: {
            ...(method !== 'GET'
                ? {
                    origin: origin,
                    'X-Subox-Admin': '1',
                }
                : {}),
                ...headers,
        },
    });
}