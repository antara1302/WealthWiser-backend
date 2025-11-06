const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
    let token;

    // 1. FIRST, check if the header exists and is correctly formatted
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // 2. ONLY THEN, try to get the token and verify it
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (err) {
            // This catch is for a token that is present but invalid/expired
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        // 3. If the header is missing or not a Bearer token, send the error
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};
