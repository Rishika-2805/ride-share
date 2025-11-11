const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async (req, res, next) => {
const header = req.header('Authorization');
if(!header) return res.status(401).json({ msg: 'No token provided' });
const token = header.split(' ')[1];
if(!token) return res.status(401).json({ msg: 'No token' });
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(payload.id).lean();
if(!user) return res.status(401).json({ msg: 'Invalid token' });
req.user = user;
next();
} catch(err) {
console.error(err);
res.status(401).json({ msg: 'Token invalid' });
}
};