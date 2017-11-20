'use strict';

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;

/**
 *
 * @param {*} adminConnection
 */
function startAndConnect(adminConnection)    {
    let metadata = { version:1 };
    metadata.userName = 'PeerAdmin';
    metadata.roles = 'PeerAdmin';
    const deployCardName = 'deployer-card';

    let idCard_PeerAdmin = new IdCard(metadata, {type : 'embedded',name:'defaultProfile'});
    idCard_PeerAdmin.setCredentials({ certificate: 'cert', privateKey: 'key' });

    let businessNetworkDefinition;

    return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
            .then(() => {
                return adminConnection.connect(deployCardName);
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory('./test/data/bond-network');
            })
            .then((result) => {
                businessNetworkDefinition = result;

                return adminConnection.install(businessNetworkDefinition.getName());
            })
            .then(()=>{
                return adminConnection.start(businessNetworkDefinition,{networkAdmins :[{userName:'admin',secret:'adminpw'}] });
            })
            .then(() => {
                let idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                return adminConnection.importCard('admin@bond-network', idCard);
            })
            .then(()=>{
                return businessNetworkDefinition;
            })
            ;

}

module.exports.startAndConnect = startAndConnect;