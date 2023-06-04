const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Specific for a product, will define tracker + url pairs
const TrackerData = new Schema({
    tracker: {type: Schema.Types.ObjectId, ref: 'Tracker'}, //the racker itstelf
    url: String, //Url to use with this tracker
    stocked: Boolean, //Is this product in stock on this site
    lastStocked: Date, //When was this product last in stock
    lastPrice: Number, //What was the last price
});

module.exports = Product = mongoose.model('TrackerData', TrackerData);