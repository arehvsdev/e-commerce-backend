const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/index');
const generateToken = require('../utils/generateToken');
const healthCheck = (req, res) => {
    try {
        res.status(200).json({
            message: "Health check successful"
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const registerUser = async(req, res) => {
    try {
        console.log("Register user called");
        console.log(req.body);
        const {name, email, password,role,phone} = req.body;

        const userExist = await User.findOne({email});
        console.log(userExist);
        if( userExist) {
            return res.status(400).json({message: "User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log(hashedPassword);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone
        });
        await user.save();
        res.status(201).json({message: "User registered successfully"});

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const loginUser = async(req, res) => {
    try {
        console.log("Login user called");
        const {email, password} = req.body;

        const user = await User.findOne({email});
        if( !user){
            return res.status(404).json({message: "User not found"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const token = await generateToken({id: user._id, email: user.email, role: user.role});
        console.log("Generated token:", token);
        return res.status(200).json({
                message: "Login successful",
                token
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
  healthCheck,
  registerUser,
  loginUser,
};