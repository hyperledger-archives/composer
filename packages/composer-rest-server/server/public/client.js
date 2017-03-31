function showAddIdentity(walletID) {
    $('#walletID').val(walletID);
    $('#myModal').modal();
}

function addIdentity() {
    var walletID = $('#walletID').val();
    var enrollmentID = $('#enrollmentID').val();
    var enrollmentSecret = $('#enrollmentSecret').val();
    $.ajax({
        type: 'POST',
        url: '/api/wallets/' + walletID + '/identities',
        contentType: 'application/json',
        data: JSON.stringify({
            enrollmentID: enrollmentID,
            enrollmentSecret: enrollmentSecret
        }),
        success: function () {
            window.location.reload();
        }
    });
}

function setDefaultIdentity(walletID, identityID) {
    $.ajax({
        type: 'POST',
        url: '/api/wallets/' + walletID + '/identities/' + identityID + '/setDefault',
        success: function () {
            window.location.reload();
        }
    });
}
