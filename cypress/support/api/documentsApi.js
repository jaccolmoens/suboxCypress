import { multipartRequest } from './multipartRequest';

export function uploadTermsPdf(fixturePath, currentVersion) {
    return multipartRequest({
        path: '/admin/terms',
        headers: {
            'If-Match': currentVersion,
        },
        files: [
            {
                field: 'pdf',
                fixture: fixturePath,
                filename: 'test-voorwaarden.pdf',
                mimeType: 'application/pdf',
            },
        ],
    });
}