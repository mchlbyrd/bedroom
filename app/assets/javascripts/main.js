window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1);
          };
})();


var fullScreenMode = $('.panels').hasClass('panel--right-full');

$(document).ready(function(){
    events();
    main();
    toggleFullscreen();
    
});

function events(){
    $('#controlFullscreen').on('click',function(e){
        toggleFullscreen();
    })
    
    $('.grid-item').on('click',function(e){
        e.preventDefault();
    });
    
    $('.entry').each(function(){
        if($(this).hasClass('entry--selected')){
            $(this).removeClass('entry--selected');
            checkSelected($(this));
        }
    });

    $('.entry').on('click',function(e){
        e.preventDefault();
        checkSelected($(this));
    });
    
    $('#camControlSubmit').on('click',function(e){
        $(this).closest('form').submit();
    });
    
    $('#camControl').on('submit',function(e){
       e.preventDefault();
       setCameraAndLight($(this).serializeArray());
    });
    
    $('#camControlX').val(goalCameraPosition.x);
    $('#camControlY').val(goalCameraPosition.y);
    $('#camControlZ').val(goalCameraPosition.z);
    $('#camControlZoom').val(goalCameraPosition.zoom);
    $('#lightControlIntensity').val(goalLightPosition.intensity);
}

function toggleFullscreen(){
    fullScreenMode = !fullScreenMode;
    $('.panels').toggleClass('panel--right-full',fullScreenMode);
    updateContainer();
}

function checkSelected($el){
        var $this = $el;
        var $body = $this.find(".entry__body");
        var $content = $this.find(".entry__body-content");
        $this.toggleClass("entry--selected");
        clearGridColor();
        if($this.hasClass("entry--selected")){
            
            $('.panel__entries').find('.entry.entry--selected').not($this).each(function(e){
                $(this).removeClass('entry--selected');
                $(this).find('.entry__body').animate({'height':0},500);
            });
            
            $body.animate({'height':$content.height() + 55},300);
            
            setYRotation($this.data('rotation'));
            
            globalScale = parseFloat($this.data('scale')) * 0.5;
            if(isNaN(globalScale)){
                globalScale = 0;
            }
            //var model = $this.data('model');
            var model = 'bedroom2';
            if(model){
                loadModel(model);
            }
            
            var color = $this.data('color');
            
            if(color){
                setColor(color);
            }
            
            var skilldata = $this.data("skills");
            var skills = (skilldata ? skilldata.split(',') : null);
            $('.grid-item.grid-item--selected').removeClass("grid-item--selected");
            for(var s in skills){
                $('.grid-item--' + skills[s]).addClass("grid-item--selected");
            }
            $('.panel__grid-items').addClass('grid--brand-' + $this.data("brand"));
        } else {
            $('.grid-item').addClass("grid-item--selected");
            $this.removeClass("grid-item--selected");
            $body.animate({'height':0},300);
        }
}

function clearGridColor(){
    $('.panel__grid-items').removeClass('grid--brand-1')
                    .removeClass('grid--brand-2')
                    .removeClass('grid--brand-3')
                    .removeClass('grid--brand-4');
}


function main() {
        
}

