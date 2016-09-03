/*!
 * app.js: Javascript that controls the Transitcenter Public Bus Works Site
 */

function app() {}

app.init = function () {

    // don't have the carousel move forward without interaction 
    $('#persona-carousel').carousel('pause');

    // set up listeners
    app.createListeners();

}

app.collapseNavbar = function () {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }    
}


app.createListeners = function () {
    $(window).scroll(app.collapseNavbar);
    $(document).ready(app.collapseNavbar);

    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });

    $('.navbar-collapse ul li a').click(function() {
        $(this).closest('.collapse').collapse('toggle');
    });

    $('#first').click(function(){
        $('#persona-image1').attr("src","/static/website/css/images/B_1a.jpg");
        $('#persona-image2').attr("src","/static/website/css/images/B_1b.jpg");
        $('#persona-caption1').text("A grandparent waits patiently for the bus...");
        $('#persona-caption2').text("...to take them to their grandchild's birthday party.");
        $('#persona-carousel').carousel(0);
    });

    $('#second').click(function(){
        $('#persona-image1').attr("src","/static/website/css/images/B_2a.jpg");
        $('#persona-image2').attr("src","/static/website/css/images/B_2b.jpg");
        $('#persona-caption1').text("A nurse waits patiently for the bus...");
        $('#persona-caption2').text("..to take them to the hospital.");
        $('#persona-carousel').carousel(0);
    });

    $('#third').click(function(){
        $('#persona-image1').attr("src","/static/website/css/images/B_3a.jpg");
        $('#persona-image2').attr("src","/static/website/css/images/B_3b.jpg");
        $('#persona-caption1').text("A student waits patiently for the bus...");
        $('#persona-caption2').text("..to take them to their final examinations.");
        $('#persona-carousel').carousel(0);
    });

    $('#persona-carousel').on('slid.bs.carousel', function () {
        $('#keepScrolling').removeClass('hidden');
    });

    // listen for scrolling to open modals
    $(window).scroll(function() {
       var rightOneTop = $('.rightOne').offset().top,
           rightTwoTop = $('.rightTwo').offset().top,
           rightThreeTop = $('.rightThree').offset().top,
           rightFourTop = $('.rightFour').offset().top,
           rightFiveTop = $('.rightFive').offset().top,
           leftOneTop = $('.leftOne').offset().top,
           leftTwoTop = $('.leftTwo').offset().top,
           leftThreeTop = $('.leftThree').offset().top,
           leftFourTop = $('.leftFour').offset().top,
           leftFiveTop = $('.leftFive').offset().top,
           wS = $(this).scrollTop();
       if (wS > (rightOneTop - 40) && app.rightOne){
           $('#rightOne').modal('show');
           app.rightOne = false;
       }
       if (wS > (rightTwoTop - 40) && app.rightTwo){
           $('#rightTwo').modal('show');
           app.rightTwo = false;
       }
       if (wS > (rightThreeTop - 40) && app.rightThree){
           $('#rightThree').modal('show');
           app.rightThree = false;
       }
       if (wS > (rightFourTop - 40) && app.rightFour){
           $('#rightFour').modal('show');
           app.rightFour = false;
       }
       if (wS > (rightFiveTop - 40) && app.rightFive){
           $('#rightFive').modal('show');
           app.rightFive = false;
       }
       if (wS > (leftOneTop - 40) && app.leftOne){
           $('#leftOne').modal('show');
           app.leftOne = false;
       }
       if (wS > (leftTwoTop - 40) && app.leftTwo){
           $('#leftTwo').modal('show');
           app.leftTwo = false;
       }
       if (wS > (leftThreeTop - 40) && app.leftThree){
           $('#leftThree').modal('show');
           app.leftThree = false;
       }
       if (wS > (leftFourTop - 40) && app.leftFour){
           $('#leftFour').modal('show');
           app.leftFour = false;
       }
       if (wS > (leftFiveTop - 40) && app.leftFive){
           $('#leftFive').modal('show');
           app.leftFive = false;
       }
    });

    // set all modals to false if someone clicks resources
    $('#clickResources').click(function(){
        app.rightOne = false;
        app.rightTwo = false;
        app.rightThree = false;
        app.rightFour = false;
        app.rightFive = false;
        app.leftOne = false;
        app.leftTwo = false;
        app.leftThree = false;
        app.leftFour = false;
        app.leftFive = false;
    });

    // if page top clicked, reset modals
    $('#clickPageTop').click(function(){
        window.setTimeout(function() {
            app.rightOne = true;
            app.rightTwo = true;
            app.rightThree = true;
            app.rightFour = true;
            app.rightFive = true;
            app.leftOne = true;
            app.leftTwo = true;
            app.leftThree = true;
            app.leftFour = true;
            app.leftFive = true;
        }, 2000);
    });

}

/* remember states of modals */
app.rightOne = true;
app.rightTwo = true;
app.rightThree = true;
app.rightFour = true;
app.rightFive = true;
app.leftOne = true;
app.leftTwo = true;
app.leftThree = true;
app.leftFour = true;
app.leftFive = true;













