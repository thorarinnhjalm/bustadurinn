export default function handler(req, res) {
    res.status(200).json({
        SA: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
        PROJECT: process.env.VITE_FIREBASE_PROJECT_ID || 'missing',
        NODE: process.version,
        TIME: new Date().toISOString()
    });
}
