
$(function(){
    $('a').each(function(){
        if ($(this).prop('href') == window.location.href) {
            $(this).addClass('active'); $(this).closest('li').addClass('active');
            $(this).parent().parent().parent().addClass('active');
        }
    });
});


$(function(){
    $('.context-nav > ul > li').each(function(){
      $(this).css('height',$(this).height());
      $(this).addClass('hide');
    });
});



var timer;
var delay = 250;

$('.context-nav > ul > li').each(function(){
      var themenuitem = $(this); // necessary to get 'this' to work for some reason
      $(this).hover(function() {
          // on mouse in, start a timeout
          timer = setTimeout(function() {
              themenuitem.removeClass('hide');
              // do your stuff here
          }, delay);
      }, function() {
          // on mouse out, cancel the timer
          clearTimeout(timer);
          themenuitem.addClass('hide');
      });
  });
