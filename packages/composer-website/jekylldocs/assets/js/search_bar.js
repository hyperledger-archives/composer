$(document).ready(function() {
    $('.trigger').parent().on('click',function() {
    $('.search-box').addClass('opened');
    $('.submit-input').removeClass('hide');
    $('.search-icon').addClass('hide');
    $('.search-box').focus();
  });

});
