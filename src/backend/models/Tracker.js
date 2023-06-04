const mongoose = require('mongoose');
Schema = mongoose.Schema;


//Specific per domain

const TrackerSchema = new Schema({
    name: String, //usually set to the domain
    conditionsPositive: [{
        selector: String,
        value: String
    }],
    conditionsNegative: [{
        selector: String,
        value: String
    }], //Conditions for listing to be considered out of stock (selector, value)
    priceSelector: String,
    rateLimit: Number, //in mins
    lastUpdated: Date
    
});

module.exports = Tracker = mongoose.model('Tracker', TrackerSchema);