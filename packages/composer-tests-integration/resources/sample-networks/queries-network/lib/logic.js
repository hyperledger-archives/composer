/**
 * Track the trade of a commodity from one trader to another
 * @param {org.acme.biznet.Trade} trade - the trade to be processed
 * @transaction
 */
function tradeCommodity(trade) {

    // set the new owner of the commodity
    trade.commodity.owner = trade.newOwner;
    return getAssetRegistry('org.acme.biznet.Commodity')
        .then(function (assetRegistry) {

            // emit a notification that a trade has occurred
            var tradeNotification = getFactory().newEvent('org.acme.biznet', 'TradeNotification');
            tradeNotification.commodity = trade.commodity;
            emit(tradeNotification);

            // persist the state of the commodity
            return assetRegistry.update(trade.commodity);
        });
}

/**
 * Remove all high volume commodities
 * @param {org.acme.biznet.RemoveHighQuantityCommodities} remove - the remove to be processed
 * @transaction
 */
function removeHighQuantityCommodities(remove) {

    return getAssetRegistry('org.acme.biznet.Commodity')
        .then(function (assetRegistry) {
            return query('selectCommoditiesWithHighQuantity')
                    .then(function (results) {

                        var promises = [];

                        for (var n = 0; n < results.length; n++) {
                            var trade = results[n];

                            // emit a notification that a trade was removed
                            var removeNotification = getFactory().newEvent('org.acme.biznet', 'RemoveNotification');
                            removeNotification.commodity = trade;
                            emit(removeNotification);

                            // remove the commodity
                            promises.push(assetRegistry.remove(trade));
                        }

                        // we have to return all the promises
                        return Promise.all(promises);
                    });
        });
}
