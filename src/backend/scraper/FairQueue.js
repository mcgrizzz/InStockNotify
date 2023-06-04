
/**
 * [
 *  { //normalQueue with all same sized time (scrape rates)
 *      priority: 1, //how many shares... 
 *      queue: [{...}]
 *  },
 *  { 
 *      priority: 2,
 *      queue: [{...}]
 *  },
 *  { 
 *      priority: 3,
 *      queue: [{...}]
 *  }
 * 
 * ]
 * 
 * 
 * 
 */


class FairQueue {

    #fairQueue;
    #priorityGroup;
    #queueIndex;

    constructor(){
        this.#fairQueue = [];
        this.#priorityGroup = 0; //Which queue are we in
        this.#queueIndex = 0; //How many dequeues we have preformed in our current group
    }

    #priorityFn(priority){
        return priority; //linear (ex: priority 1 will be done after completing 1 dequeue)
        //return Math.pow(2, priority - 1); //exponential
    }

    addItem(a, priority){
        //Is there a bucket with this time
        for(let i = 0; i < this.#fairQueue.length; i++){
            const bucket = this.#fairQueue[i];
            if(bucket.priority == priority){
                bucket.queue.push(a); //push puts on the end, pop removes from the end as well. Use shift() to pop from the front
                return;
            }
        }

        //no current bucket, add one
        let localQueue = [];
        localQueue.push(a);

        this.#fairQueue.push({
            priority: priority,
            queue: localQueue
        });

        this.#fairQueue.sort((a, b) => {
            a.priority - b.priority;
        });
    }

    removeItem(a){
        for(let i = 0; i < this.#fairQueue.length; i++){
            const queue = this.#fairQueue[i].queue;
            for(let b = 0; b < queue.length; b++){
                if(JSON.stringify(queue[b]) == JSON.stringify(a)){
                    this.#fairQueue[i] == queue.splice(b, 1);
                    if(this.#fairQueue[i].length == 0){ //if empty we now remove this bucket
                        this.#fairQueue = this.#fairQueue.splice(i, 1);
                        //Fix our structure in case we were on this queue and it was the last
                        if(this.#priorityGroup == i && this.#fairQueue.length == i){
                            this.#priorityGroup = 0;
                            this.#queueIndex = 0;
                        }

                        this.#fairQueue.sort((a, b) => {
                            a.priority - b.priority;
                        });
                    }
                    return;
                }
            }
        }
    }

    isEmpty(){
        return this.#fairQueue.length == 0;
    }

    get(){
        const bucket = this.#fairQueue[this.#priorityGroup];
        const item = bucket.queue.shift(); //Get from front
        bucket.queue.push(item); //move to back

        if(this.#queueIndex == (this.#priorityFn(bucket.priority) - 1)){
            //We switch to next queue;
            this.#queueIndex = 0;
            this.#priorityGroup = (this.#priorityGroup + 1) % this.#fairQueue.length;
        }else{
            this.#queueIndex++;
        }

        return item;

    }
}

module.exports = FairQueue;