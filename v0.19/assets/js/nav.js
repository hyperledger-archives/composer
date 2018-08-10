/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var openRotation = 0;
var closeRotation = 270;

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
            $(this).parent().parent().closest('li').addClass('activeBorder');
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
        if (!$(this).parent().parent().parent().hasClass('active')) {
            $(this).addClass('hidden');
        }
    });
});

$('li').hover(function(){
    if (!$(this).hasClass('active') && $(this).children('ul').length > 0) {
        $(this).find('.caret').toggleClass('hidden');
    }
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
