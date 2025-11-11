const express = require('express');
const mongoose = require('mongoose');
const Chatroom = require('../models/Chatroom');
const Ride = require('../models/Ride');
const auth = require('../middlewares/auth');

module.exports = (io) => {
  const router = express.Router();

  // Get chatroom for a ride
  router.get('/ride/:rideId', auth, async (req, res) => {
    try {
      const rideId = req.params.rideId;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(rideId)) {
        return res.status(400).json({ msg: 'Invalid ride id' });
      }

      // Check if user is part of the ride
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ msg: 'Ride not found' });
      }

      const isParticipant = ride.members.some(m => m.toString() === userId.toString()) || 
                           ride.rider.toString() === userId.toString();
      
      if (!isParticipant) {
        return res.status(403).json({ msg: 'Not authorized to access this chatroom' });
      }

      // Find or create chatroom
      let chatroom = await Chatroom.findOne({ rideId: ride._id })
        .populate('participants', 'name email phone')
        .populate('messages.sender', 'name');

      if (!chatroom && ride.chatroomId) {
        chatroom = await Chatroom.findById(ride.chatroomId)
          .populate('participants', 'name email phone')
          .populate('messages.sender', 'name');
      }

      if (!chatroom) {
        return res.status(404).json({ msg: 'Chatroom not found for this ride' });
      }

      return res.json(chatroom);
    } catch (err) {
      console.error('Get chatroom error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  // Send a message in chatroom
  router.post('/chatroom/:chatroomId/message', auth, async (req, res) => {
    try {
      const chatroomId = req.params.chatroomId;
      const { message } = req.body;
      const userId = req.user._id;

      if (!message || !message.trim()) {
        return res.status(400).json({ msg: 'Message is required' });
      }

      if (!mongoose.Types.ObjectId.isValid(chatroomId)) {
        return res.status(400).json({ msg: 'Invalid chatroom id' });
      }

      const chatroom = await Chatroom.findById(chatroomId);
      if (!chatroom) {
        return res.status(404).json({ msg: 'Chatroom not found' });
      }

      // Check if user is a participant
      const isParticipant = chatroom.participants.some(p => p.toString() === userId.toString());
      if (!isParticipant) {
        return res.status(403).json({ msg: 'Not authorized to send messages in this chatroom' });
      }

      // Add message
      chatroom.messages.push({
        sender: userId,
        message: message.trim(),
        timestamp: new Date()
      });

      await chatroom.save();

      // Populate sender info
      const populatedChatroom = await Chatroom.findById(chatroomId)
        .populate('participants', 'name email phone')
        .populate('messages.sender', 'name');

      // Emit message to all participants via Socket.IO
      io.emit(`chatroom:${chatroomId}:message`, {
        chatroomId: chatroomId,
        message: {
          sender: {
            id: userId.toString(),
            name: req.user.name
          },
          message: message.trim(),
          timestamp: new Date()
        }
      });

      return res.json(populatedChatroom);
    } catch (err) {
      console.error('Send message error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  // Get all chatrooms for current user
  router.get('/my-chatrooms', auth, async (req, res) => {
    try {
      const userId = req.user._id;

      const chatrooms = await Chatroom.find({
        participants: userId,
        isActive: true
      })
        .populate('rideId', 'pickup drop status')
        .populate('participants', 'name email phone')
        .populate('messages.sender', 'name')
        .sort({ createdAt: -1 });

      return res.json(chatrooms);
    } catch (err) {
      console.error('Get my chatrooms error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};

