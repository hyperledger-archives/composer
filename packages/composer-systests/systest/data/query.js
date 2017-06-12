/*eslint no-var: 0*/
/* eslint-disable no-unused-vars*/
/* eslint-disable no-undef*/
/* eslint-disable func-names*/
/* eslint-disable no-var*/
'use strict';

/**
 * Sample transaction processor function.
 * @param {org.fabric_composer.marbles.QueryMarbleByOwner} transaction
 * @transaction
 * @return {Promise} a promise to the results of transaction processing
 */
function onQueryMarbleByOwner(transaction) {
    var factory = getFactory();

    // var q = {
    //     selector : {
    //         data : {
    //             colour : 'RED'
    //         }
    //     }
    // };

    // var q = {
    //     selector : {
    //         _id : {
    //             $gt : null
    //         }
    //     }
    // };

    var q = {
        selector : {
            size : 'SMALL'
        }
    };

    var queryString = JSON.stringify(q);
    return queryNative(queryString)
        .then(function (resultArray) {
            // if(typeof resultArray === 'Array'){

            // }
            print('What is the typeof resultArray',typeof resultArray);
            print('keys of resultArray', Object.keys(resultArray.keys));
            print('prototype of resultArray', resultArray.prototype);

            var resultArrayJson = JSON.stringify(resultArray);
            print('What is the resultArray as JSON',resultArrayJson);

            // var marblesJson = JSON.parse(marblesString);
            // console.log('what is the marblesJson',marblesJson );
            if( resultArray.length !== 5 )
                {throw new Error('The incorrect number of marbles found: ',resultArray.length);}

            for(var x=0; x<resultArray.length;x++){
                var currentResult = resultArray[x];
                print(JSON.stringify(currentResult));

                if(currentResult.Record.size !== 'SMALL')
                    {throw new Error('Find an invalid marble', currentResult.Record );}
            }

       // print('querystring is: ' + queryTransaction.queryString )
            // print('TP function got result of query: ' + resultArray );
            // let sz = resultArray.ArrayList.length;
            // print('TP reuslt size =' + sz);
            // let marblesString = JSON.stringify(resultArray);
            // let marbles = JSON.parse(marblesString);
            // let marbleList = new ArrayList();

            // if(marbles.length === 0){
            //     throw new Error('No Marble returned');
            // }
            // for( let i=0; i<marbles.length; i++){
            //     print('marble[' + i +']=' + marbles[i].Record.size);
            //     // let marbleJSON = serializer.toJSON(marbles[i].Record);
            //     // marbleList.add(marbleJSON);
            // }

        });
}