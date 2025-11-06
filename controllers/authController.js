const User = require('../models/user.model.js');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
}

//register user
const registerUser = async (req, res) => {
    const { fullName, email, password, avatarImgUrl } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    } try {
        //check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        //create user
        const user = await User.create({
            fullName,
            email,
            password,
            avatarImgUrl
        });
        console.log('User registered:', user);

        res.status(201).json({
            id: user._id,
            user,
            token: generateToken(user._id)
        })


    } catch (err) {
        res
            .status(500)
            .json({ message: 'error registering user', error: err.message });
    }


}

//login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        res.status(200).json({
            id: user._id,
            user,
            token: generateToken(user._id)
        });

    } catch (err) {
        return res
            .status(500)
            .json({ message: 'error logging in user', error: err.message });
    }
}

//get user info
const getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    }
    catch (err) {
        return res
            .status(500)
            .json({ message: 'error getting user info', error: err.message });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUserInfo
};