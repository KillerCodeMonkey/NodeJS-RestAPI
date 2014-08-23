/*global define*/
/*jslint vars:true,plusplus:true*/
define([], function () {
    'use strict';

    var Cache = function (resolve) {
        var cache = {};

        return {
            'get': function (itemname, callback) {
                if (cache[itemname]) {
                    // update item with new date
                    cache[itemname].date = new Date();
                    return callback(cache[itemname].item);
                }

                // resolve the item with the specific name
                resolve(itemname, function (item) {
                    // create new cache item
                    var cacheitem = {
                        key: itemname,
                        item: item,
                        date: new Date()
                    };

                    cache[itemname] = cacheitem;
                    callback(item);
                });

            }
        };
    };

    return Cache;
});