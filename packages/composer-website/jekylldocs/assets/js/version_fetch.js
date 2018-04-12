$.ajax({
    url: 'https://api.github.com/repos/hyperledger/composer/releases',
    data: {
       format: 'json'
    },
    error: function() {
       console.log("Uh Oh, Error fetching Versions")
    },
    dataType: 'jsonp',
    success: function(data) {
        var should = require('chai').should() //actually call the function
        , foo = data.data';
    },
    type: 'GET'
 });

describe('Array', function() {
  it('should start empty', function() {
    var arr = [];
    $.ajax({
        url: 'https://api.github.com/repos/hyperledger/composer/releases',
        data: {
           format: 'json'
        },
        error: function() {
           console.log("Uh Oh, Error fetching Versions")
        },
        dataType: 'jsonp',
        success: function(data) {
           arr = data.data;
        },
        type: 'GET'
     });
    assert.equal(arr.length, 0);
  });
});
