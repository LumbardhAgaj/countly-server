const EventEmitter = require('events');
const plugins = require('../../../plugins/pluginManager.js');
const log = require('../../utils/logger.js')("batcher");

/**
 *  Class for batching database operations for aggregated data 
 *  @example
 *  let batcher = new Batcher(common.db);
 *  batcher.set("eventsa8bb6a86cc8026768c0fbb8ed5689b386909ee5c", "no-segment_2020:0_2", {"$set":{"segments.name":true, "name.Runner":true}});
 */
class Batcher extends EventEmitter {
    /**
     *  Create batche instance
     *  @param {Db} db - database object
     *  @param {String} collection - name of the collection on which to apply operations
     */
    constructor(db) {
        super();
        this.db = db;
        this.data = {};
        this.loadConfig();
        this.schedule();
    }

    /**
     *  Reloads server configs
     */
    loadConfig() {
        this.period = plugins.getConfig("api").batch_period;
    }

    /**
     *  Writes data to database for specific collection
     *  @param {string} collection - name of the collection for which to write data
     */
    async flush(collection) {
        if (Object.keys(this.data[collection]).length) {
            var queries = [];
            for (let key in this.data[collection]) {
                if (Object.keys(this.data[collection][key]).length) {
                    queries.push({
                        updateOne: {
                            filter: {_id: key},
                            update: this.data[collection][key],
                            upsert: true
                        }
                    });
                }
            }
            this.data[collection] = {};
            try {
                await this.collection.bulkWrite(queries, {ordered: false});
                this.emit("flushed");
            }
            catch (ex) {
                this.emit("error", ex);
                log.e("Error updating documents", ex);

                //trying to rollback operations to try again on next iteration
                for (let i = 0; i < queries.length; i++) {
                    //if we don't have anything for this document yet just use query
                    if (!this.data[collection][queries[i].updateOne.filter._id]) {
                        this.data[collection][queries[i].updateOne.filter._id] = queries[i].updateOne.update;
                    }
                    else {
                        //if we have, then we can try to merge query back in
                        this.data[collection][queries[i].updateOne.filter._id] = mergeQuery(queries[i].updateOne.update, this.data[collection][queries[i].updateOne.filter._id]);
                    }
                }
            }
        }
    }

    /**
     *  Run all pending database queries
     */
    async flushAll() {
        for (let collection in this.data) {
            this.flush(collection);
        }
        this.schedule();
    }

    /**
     *  Schedule next flush
     */
    schedule() {
        setTimeout(() => {
            this.loadConfig();
            this.flushAll();
        }, this.period * 1000);
    }

    /**
     *  Get operation on document by id
     *  @param {string} collection - name of the collection where to update data
     *  @param {string} id - id of the document
     *  @returns {object} bulkwrite query for document by reference, you can modify it synchronously or data may be lost
     */
    get(collection, id) {
        if (!this.data[collection]) {
            this.data[collection] = {};
        }
        if (!this.data[collection][id]) {
            this.data[collection][id] = {};
        }
        return this.data[collection][id];
    }

    /**
     *  Provide operation for document id and batcher will try to merge multiple operations
     *  @param {string} collection - name of the collection where to update data
     *  @param {string} id - id of the document
     *  @param {object} operation - operation
     */
    set(collection, id, operation) {
        if (!this.data[collection]) {
            this.data[collection] = {};
        }
        if (!this.data[collection][id]) {
            this.data[collection][id] = operation;
        }
        else {
            this.data[collection][id] = mergeQuery(this.data[collection][id], operation);
        }
    }
}

/**
 *  Merge 2 mongodb update queries
 *  @param {object} ob1 - existing database update query
 *  @param {object} ob2 - addition to database update query
 *  @returns {object} merged database update query
 */
function mergeQuery(ob1, ob2) {
    if (ob2) {
        for (let key in ob2) {
            if (!ob1[key]) {
                ob1[key] = ob2[key];
            }
            else if (key === "$set" || key === "$setOnInsert" || key === "$unset") {
                for (let val in ob2[key]) {
                    ob1[key][val] = ob2[key][val];
                }
            }
            else if (key === "$inc") {
                for (let val in ob2[key]) {
                    ob1[key][val] = ob1[key][val] || 0;
                    ob1[key][val] += ob2[key][val];
                }
            }
            else if (key === "$mul") {
                for (let val in ob2[key]) {
                    ob1[key][val] = ob1[key][val] || 0;
                    ob1[key][val] *= ob2[key][val];
                }
            }
            else if (key === "$min") {
                for (let val in ob2[key]) {
                    ob1[key][val] = ob1[key][val] || ob2[key][val];
                    ob1[key][val] = Math.min(ob1[key][val], ob2[key][val]);
                }
            }
            else if (key === "$max") {
                for (let val in ob2[key]) {
                    ob1[key][val] = ob1[key][val] || ob2[key][val];
                    ob1[key][val] = Math.max(ob1[key][val], ob2[key][val]);
                }
            }
        }
    }

    return ob1;
}

module.exports = Batcher;