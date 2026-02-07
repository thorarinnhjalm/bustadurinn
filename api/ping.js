export default function handler(req, res) {
    res.status(200).json({
        ping: 'pong',
        time: new Date().toISOString(),
        node: process.version,
        env: process.env.NODE_ENV
    });
}
