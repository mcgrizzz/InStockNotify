const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');


const ScrapeManager = require('./scraper/ScrapeManager');

const Product = require('./models/Product.js');
const Tracker = require('./models/Tracker.js');

const trackersRoute = require('./routes/trackers');
const productsRoute = require('./routes/products');

const scrapeManager = new ScrapeManager();

const app = express();
app.use(cors());
app.use(express.json());


const scraperMiddleware = (req, res, next) => {
    req.scrapeManager = scrapeManager;
    next();
};

//express.static.mime.define({'application/javascript': ['js']});
const options = {
    setHeaders (res, path, stat) {
        if(path.includes('.js')){
            res.set('Content-Type', 'application/javascript');
        }
    }
};

app.use(express.static(path.join(__dirname, '/public'), options));

app.use('/api/trackers', scraperMiddleware, trackersRoute);
app.use('/api/products', scraperMiddleware, productsRoute);


app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html')/**, {headers:{"Content-Type": "application/javascript"}}*/);
});



main().catch(err => console.log(err));

async function createProductTracker(){
    const tracker = new Tracker({conditionsPositive: [], conditionsNegative: []});
    tracker.name = "ninjakitchen.com"
    tracker.conditionsPositive.push({
        selector: '#main-content > ish-product-page > div > div > sn-product-detail > div > div.col-12.col-md-6.col-lg-5.product-details--info > div > form > ish-product-add-to-basket > div > button', 
        value: "Add to Cart"
    });

    tracker.conditionsNegative.push({
        selector: '#main-content > ish-product-page > div > div > sn-product-detail > div > div.col-12.col-md-6.col-lg-5.product-details--info > div > div.price-container.ng-star-inserted > ish-product-inventory > div > span', 
        value: "Out of Stock"
    });

    tracker.priceSelector = '#main-content > ish-product-page > div > div > sn-product-detail > div > div.col-12.col-md-6.col-lg-5.product-details--info > div > div.price-container.ng-star-inserted > ish-product-price > div';
    tracker.rateLimit = 60;
    await tracker.save();

    const product = new Product();
    product.name = "Ninja Creami Deluxe";
    product.priority = 2;
    product.lastUpdated = new Date();
    product.activeTrackers = [
        {   
            tracker: tracker._id,
            url: "https://www.ninjakitchen.com/products/-ninja-creami-deluxe-11-in-1-ice-cream-and-frozen-treat-maker-zidNC501",
            stocked: false,
            lastStocked: new Date(),
            lastPrice: 249.99
        }
    ];
    await product.save();

    const product2 = new Product();
    product2.name = "Creami Breeze";
    product2.priority = 1;
    product2.lastUpdated = new Date();
    product2.activeTrackers = [
        {   
            tracker: tracker._id,
            url: "https://www.ninjakitchen.com/products/ninja-creami-breeze-7-in-1-ice-cream-maker-zidNC201",
            stocked: false,
            lastStocked: new Date(),
            lastPrice: 249.99
        }
    ];
    await product2.save();
}

async function main() {
    const server = process.env.MONGO_SERVER || "127.0.0.1";
    const mongoPort = process.env.MONGO_PORT || 27017;
    const dbName = process.env.MONGO_DB_NAME || "stock-notify";

    const mongoUsername = process.env.MONGO_USER;
    const mongoPassword = process.env.MONGO_PASS_FILE && await fs.promises.readFile(process.env.MONGO_PASS_FILE, 'utf8');

    if(mongoPassword){
        //with authentication
        await mongoose.connect(`mongodb://${mongoUsername}:${mongoPassword}@${server}:${mongoPort}/${dbName}?authSource=admin`);
    }else{
        //No authentication
        await mongoose.connect(`mongodb://${server}:${mongoPort}/${dbName}`);
    }

    
    //await createProductTracker();

    const port = process.env.PORT || 5500;
    app.listen(port, () => console.log(`Listening on Port: ${port}`));

    if(process.env.SCRAPER_ENABLED || (process.argv.indexOf('--scrape') != -1)){
        console.log("Webscraping enabled...");
        scrapeManager.setup();
    }
  }

