import * as admin from 'firebase-admin';

export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        msg: 'import-success',
        apps: admin.apps.length
    });
}
