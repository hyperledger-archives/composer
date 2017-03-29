'use strict';

module.exports = function (Wallet) {

    // Disable all undesired methods.
    const whitelist = [ 'create', 'deleteById', 'find', 'findById', 'exists', 'replaceById' ];
    Wallet.sharedClass.methods().forEach((method) => {
        const name = (method.isStatic ? '' : 'prototype.') + method.name;
        if (whitelist.indexOf(name) === -1) {
            Wallet.disableRemoteMethodByName(name);
        } else if (name === 'exists') {
            // we want to remove the /:id/exists method
            method.http = [{verb: 'head', path: '/:id'}];
        } else if (name === 'replaceById') {
            // we want to remove the /:id/replace method
            method.http = [{verb: 'put', path: '/:id'}];
        }
    });
    Wallet.disableRemoteMethodByName('prototype.__get__user');
    Wallet.disableRemoteMethodByName('prototype.__count__identities');
    Wallet.disableRemoteMethodByName('prototype.__delete__identities');

    // Ensure the current user ID is stored as the owner of the wallet.
    Wallet.observe('before save', function (ctx, next) {
        if (ctx.options.accessToken) {
            ctx.instance.userId = ctx.options.accessToken.userId;
        }
        next();
    });

    // Ensure that users can only see their wallets.
    Wallet.observe('access', function (ctx, next) {
        if (ctx.options.accessToken) {
            const userId = ctx.options.accessToken.userId;
            ctx.query.where = ctx.query.where || {};
            ctx.query.where.userId = userId;
        }
        next();
    });

};
