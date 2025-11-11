const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, for backward compatibility
  pickup: { lat: Number, lng: Number, address: String },
  drop: { lat: Number, lng: Number, address: String },
  status: { 
    type: String, 
    enum: ['requested', 'awaiting_driver', 'awaiting_member_join', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'requested' 
  },
  fare: { type: Number, default: 0 },
  // Carpool/Member sharing fields
  totalFare: { type: Number, default: 0 },
  memberShare: { type: Number, default: 0 },
  membersCount: { type: Number, default: 2 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Screenshot of ride details
  rideDetailsScreenshot: { type: String }, // URL or path to uploaded screenshot
  // First-come-first-serve: track who accepted first
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acceptedAt: { type: Date },
  // Chatroom for matched users
  chatroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatroom' },
  distanceKm: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Ride', RideSchema);
