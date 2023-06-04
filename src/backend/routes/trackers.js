const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Product = require('../models/Product.js');
const Tracker = require('../models/Tracker.js');

const getData = async function() {
    const trackers = await Tracker.find({}).lean();
    return trackers;
};

const getTrackerById = async function(id) {
    const tracker = await Tracker.findOne({_id: id});
    return tracker;
}

const createNewTracker = async function() {
    const newTracker = new Tracker();
    newTracker.name = "newtracker.com";
    newTracker.priceSelector = "price-selector-here";
    newTracker.rateLimit = 60;
    newTracker.conditionsPositive = [];
    newTracker.conditionsNegative = [];
    newTracker.lastUpdated = new Date();

    await newTracker.save();
    
    return newTracker;
};

router.get(`/`, async function (req, res) {
    const data = await getData();
	res.status(200).json(data);
});

//Create a new tracker
router.post(`/`, async function (req, res) {
    try{
        const newTracker = await createNewTracker();
        res.status(201).json(newTracker);
    }catch(err){
        console.log(err);
        res.status(500).json({message: err.message});
    }
   
});

//Update existing product
router.put(`/:trackerId`, async function (req, res) {
    const trackerId = req.params.trackerId;
    const updated = req.body;

    let tracker;

    //Is this a real ID
    try{
        tracker = await getTrackerById(trackerId);
    }catch(err){
        res.status(400).json({message: "Tracker not found"});
        return;
    }
    

    //Try to update
    try{
        tracker.name = updated.name;
        tracker.rateLimit = updated.rateLimit;
        tracker.priceSelector = updated.priceSelector;

        tracker.conditionsPositive = updated.conditionsPositive;
        tracker.conditionsNegative = updated.conditionsNegative;
        tracker.lastUpdated = new Date();
        const res = await tracker.save();
        req.scrapeManager.trackerUpdated(tracker);
    }catch(err){
        console.log(err);
        res.status(500).json({message: err.message});
        return;
    }

    //Send result
	res.status(200).json(tracker);
});

module.exports = router;