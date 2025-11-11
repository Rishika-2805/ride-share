const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth');


// signup
router.post('/signup', async (req,res)=>{
const { name, email, phone, password, role } = req.body;
try {
// Validate JWT_SECRET is set
if(!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  return res.status(500).json({ msg:'Server configuration error' });
}

// Validate input
if(!name || !password) {
  return res.status(400).json({ msg:'Name and password are required' });
}
if(!email && !phone) {
  return res.status(400).json({ msg:'Email or phone is required' });
}

// Force rider role only (driver functionality removed)
const userRole = role === 'admin' ? 'admin' : 'rider';

const existing = await User.findOne({ $or:[{email},{phone}] });
if(existing) return res.status(400).json({ msg:'User already exists' });
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);
const user = new User({ name, email, phone, passwordHash, role: userRole });
await user.save();
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
} catch(err){ 
  console.error('Signup error:', err); 
  res.status(500).json({ msg:'Server error' }); 
}
});


// login
router.post('/login', async (req,res)=>{
const { emailOrPhone, password } = req.body;
try{
// Validate JWT_SECRET is set
if(!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  return res.status(500).json({ msg:'Server configuration error' });
}

// Validate input
if(!emailOrPhone || !password) {
  return res.status(400).json({ msg:'Email/phone and password are required' });
}

const user = await User.findOne({ $or:[{ email: emailOrPhone },{ phone: emailOrPhone }] });
if(!user) return res.status(400).json({ msg:'Invalid credentials' });

// Check if user has a password hash
if(!user.passwordHash) {
  console.error('User found but passwordHash is missing');
  return res.status(400).json({ msg:'Invalid credentials' });
}

const match = await bcrypt.compare(password, user.passwordHash);
if(!match) return res.status(400).json({ msg:'Invalid credentials' });

const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
} catch(err){ 
  console.error('Login error:', err); 
  res.status(500).json({ msg:'Server error' }); 
}
});


// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    return res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const { name, email, phone, password, idVerification } = req.body;
    
    // Validate that at least name is provided
    if (!name) {
      return res.status(400).json({ msg: 'Name is required' });
    }
    
    // Check if email or phone already exists for another user
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }
    
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(400).json({ msg: 'Phone already exists' });
      }
    }
    
    // Update user fields
    user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    // Update ID verification if provided
    if (idVerification) {
      // Initialize idVerification if it doesn't exist
      if (!user.idVerification) {
        user.idVerification = {
          aadhar: {},
          panCard: {},
          verified: false
        };
      }
      if (idVerification.aadhar) {
        if (!user.idVerification.aadhar) {
          user.idVerification.aadhar = {};
        }
        if (idVerification.aadhar.number) {
          user.idVerification.aadhar.number = idVerification.aadhar.number;
        }
        if (idVerification.aadhar.document) {
          user.idVerification.aadhar.document = idVerification.aadhar.document;
        }
      }
      if (idVerification.panCard) {
        if (!user.idVerification.panCard) {
          user.idVerification.panCard = {};
        }
        if (idVerification.panCard.number) {
          user.idVerification.panCard.number = idVerification.panCard.number;
        }
        if (idVerification.panCard.document) {
          user.idVerification.panCard.document = idVerification.panCard.document;
        }
      }
    }
    
    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    
    // Return user without password hash
    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    
    return res.json(userResponse);
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Email or phone already exists' });
    }
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;