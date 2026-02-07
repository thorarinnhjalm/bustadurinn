export default async function handler(req, res) {
    return res.status(200).json({
        status: 'ok',
        version: 'v23-no-imports',
        timestamp: new Date().toISOString(),
        node_version: process.version
    });
}
