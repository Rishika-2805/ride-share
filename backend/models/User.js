const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, unique: true, sparse: true },
phone: { type: String, unique: true, sparse: true },

passwordHash: { type: String },
role: { type: String, enum: ['rider','driver','admin'], default: 'rider' },
// ID Verification fields
idVerification: {
  aadhar: { 
    number: { type: String, sparse: true, default: null },
    document: { type: String, default: null } // URL or path to uploaded document
  },
  panCard: { 
    number: { type: String, sparse: true, default: null },
    document: { type: String, default: null } // URL or path to uploaded document
  },
  verified: { type: Boolean, default: false }
},
createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);