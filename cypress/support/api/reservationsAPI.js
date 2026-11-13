import { apiRequest } from "./apiClient";

export function getReservations(search) {
    return apiRequest({
        method: 'GET',
        path: '/admin/reservations',
        qs: { search },
    });
}

export function cancelReservation(id, version) {
    return apiRequest({
        method: 'POST',
        path: `/admin/reservations/${id}/cancel`,
        headers: {
            'If-Match': String(version),
            'Idempotency-Key': crypto.randomUUID(), 
        },
        body: {
            reason: "Opruimen Cypress testreservering"
        }
    })
}

export function getReservation(id) {
    return apiRequest({
        method: 'GET',
        path: `/admin/reservations/${id}`
    });
}

export function returnReservationLine(id, lineId, version) {
    return apiRequest({
        method: 'POST',
        path: `/admin/reservations/${id}/lines/${lineId}/return`,
        headers: {
            'If-Match': String(version),
            'Idempotency-Key': crypto.randomUUID(),
        },
        body: {},
    });
}

export function inspectionReservationLine(id, lineId, version) {
    return apiRequest({
        method: 'POST',
        path: `/admin/reservations/${id}/lines/${lineId}/inspect`,
        headers: {
            'If-Match': String(version),
            'Idempotency-Key': crypto.randomUUID(),
        },
        body: {
            result: "pass",
            note: "Cypress heeft er goed voor gezorgd",
        },
    });
}

export function finishReservation(id, version) {
    return apiRequest({
        method: 'POST',
        path: `/admin/reservations/${id}/finish`,
        headers: {
            'If-Match': String(version),
            'Idempotency-Key': crypto.randomUUID(),
        },
        body: {},
    });
}