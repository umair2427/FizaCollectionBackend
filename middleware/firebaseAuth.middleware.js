const admin = require('../data/config/firebase_admin/index');

async function verifyIdToken(idToken) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        // Return any additional data or perform further actions if needed
        return { success: true, uid };
    } catch (error) {
        console.error('Error verifying ID token:', error);

        return { success: false, error: error.message };
    }
}

function verifyTokenMiddleware(req, res, next) {
    const idToken = req.headers.authorization;

    if (!idToken) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    verifyIdToken(idToken)
        .then((result) => {
            if (result.success) {
                req.user = { uid: result.uid };
                next();
            } else {
                return res.status(403).json(result);
            }
        })
        .catch((error) => {
            console.error('Unexpected error:', error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        });
}

module.exports = { verifyTokenMiddleware };
