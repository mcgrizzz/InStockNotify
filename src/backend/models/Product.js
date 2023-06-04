const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TrackerData = require('./TrackerData');

//Specific for a product, will define tracker + url pairs
const ProductSchema = new Schema({
    name: String,
    priority: Number,
    activeTrackers: [TrackerData.schema],
    lastUpdated: Date
});

module.exports = Product = mongoose.model('Product', ProductSchema);