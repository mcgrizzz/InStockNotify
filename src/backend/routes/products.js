const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Product = require('../models/Product.js');
const Tracker = require('../models/Tracker.js');

const findAllProducts = async function() {
    const products = await Product.find({})
        .lean()
        .populate('activeTrackers.tracker');
    return products;
};

const createNewProduct = async function() {
    const newProduct = new Product();
    newProduct.name = "New Product";
    newProduct.priority = 1;
    newProduct.trackers = [];
    newProduct.lastUpdated = new Date();
    await newProduct.save();
    
    return newProduct;
};

const getProductById = async function(id) {
    const product = await Product.findOne({_id: id});
    return product;
}

//Get all products
router.get(`/`, async function (req, res) {
    const products = await findAllProducts();
	res.status(200).json(products);
});

//Create a new product
router.post(`/`, async function (req, res) {
    try{
        const newProduct = await createNewProduct();
        res.status(201).json(newProduct);
    }catch(err){
        console.log(err);
        res.status(500).json({message: err.message});
    }
   
});

//Update existing product
router.put(`/:productId`, async function (req, res) {
    const productId = req.params.productId;
    const updated = req.body;

    let product;

    //Is this a real ID
    try{
        product = await getProductById(productId);
    }catch(err){
        res.status(400).json({message: "Product not found"});
        return;
    }
    

    //Try to update
    try{
        product.name = updated.name;
        product.priority = updated.priority;

        //Remap tracker object to its ID
        updated.activeTrackers = updated.activeTrackers.map(trackerData => {
            return {
                tracker: trackerData.tracker._id,
                url: trackerData.url,
                stocked: trackerData.stocked,
                lastStocked: trackerData.lastStocked,
                lastPrice: trackerData.lastPrice
            }
        });

        product.activeTrackers = updated.activeTrackers;
        product.lastUpdated = new Date();
        await product.save();
        req.scrapeManager.productUpdated(product);
    }catch(err){
        res.status(500).json({message: err.message});
        return;
    }

    //Send result
	res.status(200).json(product);
});

module.exports = router;