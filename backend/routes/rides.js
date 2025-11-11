const express = require('express');
const mongoose = require('mongoose');
const Ride = require('../models/Ride');
const Chatroom = require('../models/Chatroom');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/roles');

module.exports = (io) => {
  const router = express.Router();

  // 1. Create a NEW Shared Ride (Request a ride)
  router.post('/', auth, requireRole(['rider']), async (req, res) => {
    const { pickup, drop, totalFare, memberShare, membersCount, rideDetailsScreenshot } = req.body;
    
    if (!pickup || !drop || !pickup.address || !drop.address) {
      return res.status(400).json({ msg: 'Pickup and drop locations with addresses are required' });
    }

    try {
      // Validate coordinates if provided
      const lat1 = parseFloat(pickup.lat);
      const lng1 = parseFloat(pickup.lng);
      const lat2 = parseFloat(drop.lat);
      const lng2 = parseFloat(drop.lng);

      // Create the new ride with the initial rider as the first member
      const ride = new Ride({
        rider: req.user._id,
        pickup: {
          lat: isNaN(lat1) ? 0 : lat1,
          lng: isNaN(lng1) ? 0 : lng1,
          address: pickup.address
        },
        drop: {
          lat: isNaN(lat2) ? 0 : lat2,
          lng: isNaN(lng2) ? 0 : lng2,
          address: drop.address
        },
        totalFare: parseFloat(totalFare) || 0,
        memberShare: parseFloat(memberShare) || 0,
        membersCount: parseInt(membersCount) || 2,
        members: [req.user._id], // The creator is the first member
        rideDetailsScreenshot: rideDetailsScreenshot || null,
        status: 'awaiting_member_join'
      });

      await ride.save();

      // Announce the new shared ride to all connected riders with push notification
      io.emit('new_shared_ride', { 
        rideId: ride._id.toString(), 
        pickup: ride.pickup, 
        drop: ride.drop, 
        memberShare: ride.memberShare,
        membersCount: ride.membersCount,
        totalFare: ride.totalFare,
        rideDetailsScreenshot: ride.rideDetailsScreenshot,
        notification: {
          title: 'New Ride Available!',
          body: `A new ride from ${ride.pickup.address} to ${ride.drop.address} is available. Share: ₹${ride.memberShare}`,
          rideId: ride._id.toString()
        }
      });

      return res.status(201).json(ride);
    } catch (err) {
      console.error('Create ride error:', err);
      console.error('Error details:', err.message);
      console.error('Stack trace:', err.stack);
      return res.status(500).json({ msg: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
  });

  // 2. Get All Available Rides (for viewing available rides page)
  router.get('/available', auth, requireRole(['rider']), async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Find rides that are:
      // - Status is 'awaiting_member_join'
      // - User is NOT already a member
      // - Ride is not full (members.length < membersCount)
      const availableRides = await Ride.find({
        status: 'awaiting_member_join',
        members: { $ne: userId }, // User is not a member
      })
      .populate('rider', 'name email phone')
      .populate('members', 'name email phone')
      .sort({ createdAt: -1 }); // Newest first
      
      // Filter out rides that are full (client-side filtering for safety, though query should handle it)
      const ridesNotFull = availableRides.filter(ride => {
        return ride.members.length < ride.membersCount;
      });
      
      // Transform to match the format expected by frontend
      const formattedRides = ridesNotFull.map(ride => ({
        rideId: ride._id.toString(),
        pickup: ride.pickup,
        drop: ride.drop,
        memberShare: ride.memberShare,
        membersCount: ride.membersCount,
        totalFare: ride.totalFare,
        rideDetailsScreenshot: ride.rideDetailsScreenshot,
        members: ride.members.map(m => m._id.toString()),
        currentMembersCount: ride.members.length,
        rider: {
          id: ride.rider._id.toString(),
          name: ride.rider.name
        }
      }));
      
      return res.json(formattedRides);
    } catch (err) {
      console.error('Get available rides error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  // 3. Member Accepts/Joins Ride (Available Rides -> Accept) - First-Come-First-Serve
  router.post('/:id/join', auth, requireRole(['rider']), async (req, res) => {
    const rideId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    try {
      // Use findOneAndUpdate with atomic operation to ensure first-come-first-serve
      const ride = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: 'awaiting_member_join',
          acceptedBy: { $exists: false }, // Only if no one has accepted yet
          members: { $ne: userId } // User is not already a member
        },
        {
          $set: {
            acceptedBy: userId,
            acceptedAt: new Date(),
            status: 'accepted'
          },
          $push: { members: userId }
        },
        { new: true }
      );

      if (!ride) {
        // Check if ride exists but was already accepted
        const existingRide = await Ride.findById(rideId);
        if (!existingRide) {
          return res.status(404).json({ msg: 'Ride not found' });
        }
        if (existingRide.status !== 'awaiting_member_join') {
          return res.status(400).json({ msg: 'Ride is no longer open for joining' });
        }
        if (existingRide.acceptedBy) {
          return res.status(400).json({ msg: 'This ride has already been accepted by another user' });
        }
        return res.status(400).json({ msg: 'Unable to join ride. Please try again.' });
      }

      // Create a chatroom for the matched users (rider and the person who accepted)
      const chatroom = new Chatroom({
        rideId: ride._id,
        participants: ride.members, // Includes both the creator and the person who accepted
        isActive: true
      });
      await chatroom.save();

      // Link chatroom to ride
      ride.chatroomId = chatroom._id;
      await ride.save();

      // Notify all connected clients that the ride has been accepted
      io.emit('ride_member_joined', { 
        rideId: ride._id.toString(), 
        newMemberId: userId.toString(), 
        newStatus: ride.status,
        currentMembers: ride.members.length,
        chatroomId: chatroom._id.toString(),
        notification: {
          title: 'Ride Accepted!',
          body: 'Someone has accepted your ride request. A chatroom has been created.',
          rideId: ride._id.toString()
        }
      });

      // Populate the ride data before returning
      const populatedRide = await Ride.findById(ride._id)
        .populate('rider', 'name email phone')
        .populate('members', 'name email phone')
        .populate('acceptedBy', 'name email phone');

      return res.json({
        ...populatedRide.toObject(),
        chatroomId: chatroom._id.toString()
      });
    } catch (err) {
      console.error('Join ride error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  // 4. Get All Rides for Current User (My Ride History)
  router.get('/my-rides', auth, requireRole(['rider']), async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Find all rides where the user is either:
      // - The rider (creator) OR
      // - A member of the ride
      const myRides = await Ride.find({
        $or: [
          { rider: userId },
          { members: userId }
        ]
      })
      .populate('rider', 'name email phone')
      .populate('members', 'name email phone')
      .sort({ createdAt: -1 }); // Newest first
      
      // Transform to match the format expected by frontend
      const formattedRides = myRides.map(ride => {
        const isCreator = ride.rider._id.toString() === userId.toString();
        const isMember = ride.members.some(m => m._id.toString() === userId.toString());
        
        return {
          rideId: ride._id.toString(),
          pickup: ride.pickup,
          drop: ride.drop,
          memberShare: ride.memberShare,
          membersCount: ride.membersCount,
          totalFare: ride.totalFare,
          status: ride.status,
          members: ride.members.map(m => ({
            id: m._id.toString(),
            name: m.name,
            email: m.email,
            phone: m.phone
          })),
          currentMembersCount: ride.members.length,
          rider: {
            id: ride.rider._id.toString(),
            name: ride.rider.name,
            email: ride.rider.email,
            phone: ride.rider.phone
          },
          isCreator: isCreator,
          isMember: isMember,
          role: isCreator ? 'creator' : 'member',
          createdAt: ride.createdAt,
          acceptedAt: ride.acceptedAt,
          startedAt: ride.startedAt,
          completedAt: ride.completedAt
        };
      });
      
      return res.json(formattedRides);
    } catch (err) {
      console.error('Get my rides error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  // 5. Get a Specific Ride Detail
  router.get('/:id', auth, async (req, res) => {
    const rideId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ msg: 'Invalid ride id' });
    }

    try {
      // Populate all the members' details
      const ride = await Ride.findById(rideId)
        .populate('rider', 'name email phone')
        .populate('members', 'name email phone');

      if (!ride) {
        return res.status(404).json({ msg: 'Ride not found' });
      }

      // Authorization: riders/members can view their rides
      const uid = req.user._id.toString();
      const isRider = ride.rider && ride.rider._id.toString() === uid;
      const isMember = ride.members && ride.members.some(m => m._id.toString() === uid);
      
      if (!isRider && !isMember && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized to view this ride' });
      }

      return res.json(ride);
    } catch (err) {
      console.error('Get ride error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};
