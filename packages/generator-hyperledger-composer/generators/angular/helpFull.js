'use strict';

module.exports = {
    mergeSuperType : (list) => {
        let newList = [];
        list.forEach(data => {
            if (data.superType !== undefined){
                for (let i = 0 ; i < list.length; i++){
                    if (list[i].type === data.superType || list[i].name === data.superType){
                        for (let j = 0; j < list[i].properties.length; j++){
                            if (data.properties.indexOf(list[i].properties[j]) === -1){
                                data.properties.push(list[i].properties[j]);
                            }
                        }
                        break;
                    }
                }
            }
            newList.push(data);
        });

        return newList;
    },
    removeOptionalValue: (asset) => {
        let assetRes = [];
        asset.forEach(data => {
            let newP = [];
            data.properties.forEach(prop => {
                if (prop.optional === undefined || prop.optional !== true) {
                    newP.push(prop);
                }
            });
            data.properties = newP;
            assetRes.push(data);
        });
        return assetRes;
    },
    fillProperties : (assets, conceptList) => {

        for (let q = 0 ; q < assets.length ; q++){
            let asset = assets[q];
            for (let qq = 0 ; qq < asset.properties.length; qq++){
                if (asset.properties[qq].constructor.name === 'RelationshipDeclaration'){ continue; }

                for (let vl in conceptList){
                    if (asset.properties[qq].type === conceptList[vl].name){
                        asset.properties[qq].properties = conceptList[vl].properties;
                        break;
                    }
                }
            }
            assets[q] = asset;
        }

        return assets;
    },
    fillNamespaceMap : (objs, assetList) => {
        let namepspacesMap = [];
        objs.forEach(obj => {
            obj.forEach(data => {
                namepspacesMap[data.name] = (data.fqn !== undefined) ? data.fqn : data.namespace;
            });
        });

        assetList.forEach((data) => {
            namepspacesMap[data.name] = ((data.fqn !== undefined) ? data.fqn : data.namespace) + '.' +  data.name;
        });

        return namepspacesMap;
    },
    fillTranascationProperties : (tranasctions, conceptList, participantList, assetList) => {
        for (let q = 0 ; q < tranasctions.length ; q++){
            for (let qq = 0 ; qq < tranasctions[q].properties.length; qq++){

                if (tranasctions[q].properties[qq].isRelational === true || tranasctions[q].properties[qq].constructor.name === 'RelationshipDeclaration' ){ continue; }

                for (let vl in conceptList){
                    if (tranasctions[q].properties[qq].type === conceptList[vl].name){
                        tranasctions[q].properties[qq].properties = conceptList[vl].properties;
                        break;
                    }
                }

                for (let vl in participantList){
                    if (tranasctions[q].properties[qq].type === participantList[vl].name){
                        tranasctions[q].properties[qq].properties = participantList[vl].properties;
                        break;
                    }
                }

                for (let vl in assetList){
                    if (tranasctions[q].properties[qq].type === assetList[vl].name){
                        tranasctions[q].properties[qq].properties = assetList[vl].properties;
                        break;
                    }
                }
            }
        }
        return tranasctions;
    }
};
