const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const FairQueue = require('./FairQueue');

class Scraper {

    //TODO:
    /**
     * 
     * 1. Update to allow product to have multiple urls, right now its productID is bound to one url
     * 
     * 
     * this.products[product._id] = {trackerDataID1: url1, trackerDataID2: url2, ...}
     * 
     */

    

    constructor(updateProductStatus){
        this.queue = new FairQueue();
        this.products = {};
        this.updateProductStatus = updateProductStatus; //scrapeResultCallback(error, trackerID, productId, stocked, price)\
        this.delay = 60*1000;
        this.delaySpan = .15; //15%
    }

    async initialize(){

        puppeteer.use(StealthPlugin());

        const options = {
            headless: 'new'
        }

        if(process.env.SCRAPER_PROXY){
            options["args"] = [`--proxy-server=${process.env.SCRAPER_PROXY}`];
        }

        this.browser = await puppeteer.launch(options);

        this.page = (await this.browser.pages())[0];

        this.loopRun = true;
        this.#loop();
    }

    async close(){
        this.loopRun = false;
        await this.browser.close();
    }

    hasProduct(productID){
        return productID in this.products;
    }

    hasScrapeData(productID, trackerDataID){
        if(!(this.hasProduct(productID)))return false;
        const product = this.products[productID];
        if(!(trackerDataID in product))return false;
        return true;
    }

    addScrapeData(productID, trackerDataID, url, priority){
        if(!(productID in this.products)){
            this.products[productID] = {};
        }
        
        this.products[productID][trackerDataID] = url;
        this.queue.addItem({productID: productID, trackerDataID: trackerDataID}, priority);
    }

    deleteScrapeData(productID, trackerDataID){ 
        this.queue.removeItem({productID: productID, trackerDataID: trackerDataID});
        delete this.products[productID][trackerDataID];
        if(Object.keys(this.products[productID]).length == 0){
            delete this.products[productID];
        }
    }

    addProduct(product){
        const activeTrackers = product.activeTrackers.filter(tData => {return tData.tracker.equals(this.tracker._id) && product.priority > 0});
        for(let i = 0; i < activeTrackers.length; i++){
            const trackerData = activeTrackers[i];
            if(!this.hasScrapeData(product._id, trackerData._id)){
                this.addScrapeData(product._id, trackerData._id, trackerData.url, product.priority);
            }
        }

        return Object.keys(this.products).length;
    }

    deleteProduct(product){
        if(this.hasProduct(product._id)){
            const trackerDataKeys = Object.keys(this.products[product._id]);
            console.log(trackerDataKeys);
            for(let i = 0; i < trackerDataKeys.length; i++){
                this.deleteScrapeData(product._id, trackerDataKeys[i]);
            }
        }

        /*const activeTrackers = product.activeTrackers.filter(tData => {return tData.tracker.equals(this.tracker._id)});
        for(let i = 0; i < activeTrackers.length; i++){
            const trackerData = activeTrackers[i];
            if(this.hasScrapeData(product._id, trackerData._id)){
                this.deleteScrapeData(product._id, trackerData._id);
            }
        }*/

        return Object.keys(this.products).length;
    }

    updateProduct(product){
        this.deleteProduct(product);
        return this.addProduct(product); //If we deleted, addProduct will not add anything
    }

    //Should work when a setting changes
    setTracker(tracker){
        this.tracker = tracker;
        this.delay = this.tracker.rateLimit*1000; //rateLimit is in seconds, we need in ms
    }

    sleep(ms){
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    trySelectorMatch($, selector, value){
        /**
         * Check priority
         * 1. tag.innerText() (ex. Ninja <button>Add to Cart</button>)
         * 2. value attribute (ex. kohls <button value="Add to Cart">)
         * 3. Partial match (ex. Amazon: <span>Usually ships within x months>)
         */
        
        let el = $(selector);
        let val = el.text();

        if(val){
            if(val.trim() == value || val.trim().includes(value)){
                return true;
            }
        }

        if(!val){
            val = el.attr('value');
        }

        return (val && val.trim() == value);
    }

    async scrapeProduct(productURL){
        try{
            await this.page.goto(productURL);
            
            await this.page.waitForSelector(this.tracker.priceSelector, {
                visible: true,
            });

            await this.page.waitForTimeout(2000);

            let anyMatchPositive = false;
            let anyMatchNegative = false;
            
            const content = await this.page.content();
            const $ = cheerio.load(content);

            //assume out of stock
            let inStock = false;

            //Go through all positive conditions, if any true, in stock
            for(let i = 0; i < this.tracker.conditionsPositive.length; i++){
                const {selector, value} = this.tracker.conditionsPositive[i];
                if(this.trySelectorMatch($, selector, value)){
                    inStock = true;
                    anyMatchPositive = true;
                    break;
                }
            }

            //go through all negative positions, if any true, out of stock
            for(let i = 0; i < this.tracker.conditionsNegative.length; i++){
                const {selector, value} = this.tracker.conditionsNegative[i];
                if(this.trySelectorMatch($, selector, value)){
                    inStock = false;
                    anyMatchNegative = true;
                    break;
                }
            }

            //TODO:
            //Likely the website changed, notify somehow
            if(!anyMatchNegative && !anyMatchPositive){
                    /**
                     * 2 cases
                     * 1. Item is in stock, but our positive match failed
                     * 2. Item is out of the stock, but our negative match failed
                     * 
                     */
            }

            //get price
            const priceSelector = this.tracker.priceSelector;
            let priceVal = $(priceSelector).text();
            priceVal = priceVal ? parseFloat(priceVal.replace(/[^0-9\.]+/g,'')) : 0;
            return {error: null, stocked: inStock, price: priceVal};
        }catch(error){
            return {error: error.message, stocked: null, price: null};
        }
    }

    #randomDelay(){
        const min = 100; //100ms
        const max = this.delay*this.delaySpan;
        return this.delay + Math.floor(Math.random() * (max - min + 1) + min);
    }

    async #loop(){
        if(this.loopRun){
            if(this.queue.isEmpty()){
                await this.sleep(this.delay);
                this.#loop();
                return;
            }

            //get a product, get its details, pass results to callback function
            const {productID, trackerDataID} = this.queue.get();
            if(this.products[productID]){
                const productURL = this.products[productID][trackerDataID];
                const result = await this.scrapeProduct(productURL);

                console.log(`Finished Scraping [${productID}] @ [${this.tracker.name}]`)
                this.updateProductStatus(result.error, trackerDataID, this.tracker._id, productID, result.stocked, result.price);
            }
            
            await this.sleep(this.#randomDelay()); //sleep the delay + some random percentage of the delay
            this.#loop();
        }
    }

}

module.exports = Scraper;