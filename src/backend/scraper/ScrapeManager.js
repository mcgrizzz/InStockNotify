const mongoose = require('mongoose');
const fetch = require('node-fetch');

const Product = require('../models/Product.js');
const Tracker = require('../models/Tracker.js');
const TrackerData = require('../models/TrackerData.js');

const Scraper = require('./Scraper.js');


class ScrapeManager {

    constructor(sendNotification){
        this.scrapers = {}; //{trackerID, scraper};
        this.isSetup = false;
    }

    static async sendProductNotification(productName, productUrl, productPrice){
        let productNameParsed = productName;
        let productUrlParsed = productUrl;
        let productPriceParsed = "" + productPrice;

    
        /*const escapedChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
       

        urlEscapes.forEach((c) => {
            productUrlParsed = productUrlParsed.replaceAll(c, '\\' + c);
        });

        escapedChars.forEach((c) => {
            productNameParsed = productNameParsed.replaceAll(c, '\\' + c);
            productPriceParsed = productPriceParsed.replaceAll(c, '\\' + c)
        });*/

        //productUrlParsed = productUrlParsed.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('&', '&amp;');
        
        const baseUrl = "https://api.telegram.org/bot6107074161:AAH3QyAlBdh3e_4H_z2fsYEXk98cJBne-Ak/sendMessage?chat_id=6002870696&parse_mode=HTML";
        
        //In Stock Notification
        //ɪɴ ꜱᴛᴏᴄᴋ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ
        //Ｉｎ　Ｓｔｏｃｋ　Ｎｏｔｉｆｉｃａｔｉｏｎ
        //𝐈𝐍 𝐒𝐓𝐎𝐂𝐊
        //ＩＮ　ＳＴＯＣＫ
        //ʙᴀᴄᴋ ɪɴ ꜱᴛᴏᴄᴋ
        let message = 
        `<b>📥 ❰ ɪɴ ꜱᴛᴏᴄᴋ ❱ 📥</b>

        <b>${productNameParsed} 📦</b>
        <b>$${productPriceParsed} 💵</b>
        <b><a href="${productUrlParsed}">OPEN LINK TO BUY</a></b>
        <b></b>
        `;
        
        const uri = baseUrl + "&text=" + encodeURIComponent(message);
        const response = await fetch(uri);
    }

    async updateProductStatus(error, trackerDataID, trackerID, productID, stocked, price){
        console.log("Updating product status: [productID]:(" + productID + ") [trackerID]:(" + trackerID + ") [stocked]:(" + stocked + ") [price]:(" + price + ") [error]:(" + error + ")");
        if(error){
            console.log(error);
            return;
        }

        try{
            const update = {"activeTrackers.$.stocked": stocked};

            if(price !== 0){
                update["activeTrackers.$.lastPrice"] = price;
            }

            if(stocked){
                update["activeTrackers.$.lastStocked"] = new Date();
            }

            const old = await Product.findOneAndUpdate({_id: productID, "activeTrackers._id": trackerDataID}, update); //atomic update, shouldn't have to worry about concurrent updating
            //console.log(old); WHY IS THIS NULL SOMETIMES....
            if(old && !old.activeTrackers.id(trackerDataID).stocked && stocked){
                ScrapeManager.sendProductNotification(old.name, old.activeTrackers.id(trackerDataID).url, price);
            }
        }catch(err){
            console.log(err);
        }
    }

    setupScraper(tracker){
        const scraper = new Scraper(this.updateProductStatus);
        scraper.setTracker(tracker);
        this.scrapers[tracker._id] = scraper;
        return scraper;
    }

    async setupScraperById(trackerID){
        const tracker = await Tracker.findOne({_id: trackerID}).lean();
        if(tracker){
            return this.setupScraper(tracker);
        }

        return null;
    }

    //TODO
    removeTracker(trackerID){
        if(Object.keys(this.scrapers).indexOf(trackerID) !== -1){
            const scraper = this.scrapers[trackerID];
            scraper.close();
            delete this.scrapers[trackerID];
            return true;
        }else{
            return false;
        }
    }

    //TODO
    removeTrackerData(product, trackerData){
        if(this.scrapers.indexOf[trackerData.tracker] !== -1){
            const scraper = this.scrapers[trackerData.tracker];
            const remainingProducts = scraper.deleteProduct(product);
        }
    }

    async setup(){
        console.log("ScrapeManager: Setting up...");
        const products = await Product.find({});
        const trackers = await Tracker.find({});

        //Build array of trackers with products assigned to them
        console.log("ScrapeManager: Finding Active trackers...");
        const associatedTrackers = [];
        products.forEach(product => {
            if(product.priority <= 0)return; //Priority zero is treated as archived/disabled
            product.activeTrackers.forEach(trackerData => {
                if(associatedTrackers.indexOf(trackerData.tracker.toString()) == -1){
                    associatedTrackers.push(trackerData.tracker.toString());
                }
            });
        });


        console.log("ScrapeManager: Creating scrapers...");
        for(let i = 0; i < trackers.length; i++){
            const tracker = trackers[i];
            if(associatedTrackers.indexOf(tracker._id.toString()) == -1)continue;
            console.log("|--- Creating scraper ["  + tracker.name + "]");
            const scraper = this.setupScraper(tracker);

            for(let i = 0; i < products.length; i++){
                const product = products[i];
                if(product.priority <= 0)continue;
                scraper.addProduct(product);
                console.log("|----|--- Adding Product [" + product.name + "]");
            }
        }


        for(const [key, value] of Object.entries(this.scrapers)){
            console.log("ScrapeManager: Initializing scraper [" + value.tracker.name + "]");
            value.initialize();
        }

        this.isSetup = true;
    }


    //TODO: not support for deleting or adding products yet
    /**
     * 
     * 1. TrackerData is changed for an existing Tracker binding
     * 2. New tracker is associated with the product
     * 3. A tracker is no longer associated with the product
     */

    //TODO
    async productUpdated(product){
        if(!this.isSetup)return;
        console.log("ScrapeManager: Product Settings Updated [" + product.name + "]");
        //Check for new trackers that don't have a scraper running
        const activeTrackers = product.activeTrackers.filter(trackerData => {
            return !(trackerData.tracker in this.scrapers);
        });

        //Sets up new trackers so the next code block doesn't need any more adjustment
        if(activeTrackers.length > 0){
            activeTrackers.forEach(async (trackerData) => {
                if(trackerData.tracker in this.scrapers)return; //Don't add duplicates
                const scraper = await this.setupScraperById(trackerData.tracker);
                scraper.initialize();
            });
        }

        //Updating tracker data and deleting tracker data are both taken care of in scraper.updateProduct()
        for(let i = 0; i < Object.keys(this.scrapers).length; i++){
            const [trackerID, scraper] = Object.entries(this.scrapers).at(i);
            const productsRemaining = scraper.updateProduct(product);
            if(productsRemaining == 0){
                //Shut this scraper down...
                if(this.removeTracker(trackerID)){
                    i--;
                }
            } 
        }


        


    }

    //Did any of the parameters change (positives, negatives, selectors, scrape rate etc)
    async trackerUpdated(trackerUpdated){
        if(!this.isSetup)return;
        console.log("ScrapeManager: Tracker Settings Updated [" + trackerUpdated.name + "]");
        for(const [key, value] of Object.entries(this.scrapers)){
            if(trackerUpdated._id == key){
                value.setTracker(trackerUpdated);
                break;
            }
        }
    }

}

module.exports = ScrapeManager;