'use strict';

module.exports = function (User) {

    // Create a default wallet for new users.
    User.observe('after save', (ctx, next) => {
        if (ctx.instance) {
            const Wallet = User.app.models.Wallet;
            Wallet.findOrCreate({
                user: ctx.instance,
                description: 'The default wallet for the logged in user'
            }, next());
        } else {
            next();
        }
    });

};
