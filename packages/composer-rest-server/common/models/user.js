'use strict';

module.exports = function (User) {

    // Create a default wallet for new users.
    User.observe('after save', (ctx, next) => {
        if (ctx.instance) {
            const Wallet = User.app.models.Wallet;
            return Wallet.findOne({ where: { userId: ctx.instance.id, createdAsDefault: true } })
                .then((wallet) => {
                    if (!wallet) {
                        return Wallet.create({ userId: ctx.instance.id, createdAsDefault: true, description: 'Default wallet' });
                    }
                })
                .then((wallet) => {
                    if (wallet) {
                        return ctx.instance.updateAttribute('defaultWallet', wallet.id);
                    }
                });
        }
        next();
    });

};
