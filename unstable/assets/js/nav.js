var openRotation = 270;
var closeRotation = 180;

$(function(){
    $('a').each(function(){
        if ($(this).prop('href') == window.location.href) {
            $(this).addClass('active');
            $(this).closest('li').addClass('active');
            $(this).parent().parent().parent().addClass('active');
        }
    });
});

$(function(){
    $('.context-nav a').each(function(){
        if ($(this).prop('href') == window.location.href) {
            $(this).parent().parent().css('background-color', 'white');
            $(this).parent().parent().parent().css('background-color', 'white');
        }
    });
});

$(function(){
    $('.caret').each(function(){
        $(this).rotate(closeRotation);
        if ($(this).closest('li').hasClass('active')) {
            $(this).rotate(openRotation);
        }
        if ($(this).closest('li').children('ul').length == 0) {
            $(this).toggleClass('hidden');
        }
    });
});

$('.caret').click(function() {
    if ($(this).closest('li').hasClass('hide')){
        $(this).rotate(openRotation);
        $(this).closest('li').toggleClass('hide');
        return false;
    } else {
        if (!$(this).closest('li').hasClass('active')) {
            $(this).rotate(closeRotation);
        }
        $(this).closest('li').toggleClass('hide');
        return false;
    }
});

$(function(){
    $('.context-nav > ul > li').each(function(){
      $(this).css('height',$(this).height());
      $(this).addClass('hide');
    });
});

$(function(){
    $('.caret').each(function(){
        $(this).addClass('hide');
    });
});

var timer;
var delay = 0;

jQuery.fn.rotate = function(degrees) {
    $(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
                 '-moz-transform' : 'rotate('+ degrees +'deg)',
                 '-ms-transform' : 'rotate('+ degrees +'deg)',
                 'transform' : 'rotate('+ degrees +'deg)'});
    return $(this);
};
