/*!
 * app.js: Javascript that controls the Transitcenter Public Bus Works Site
 */

function app() {}

app.init = function () {

    // don't have the carousel move forward without interaction 
    $('#persona-carousel').carousel('pause');

    // set up listeners
    app.createListeners();

    // set up picture book
    app.pictureBook();

    // set up report card
    app.reportCard();

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
        }, 2000, 'easeInOutQuint');
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


}

// picture book scrolling code
app.pictureBook = function () {

    var windowAspectRatio = window.innerWidth/window.innerHeight,
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/.test(navigator.userAgent);

    // console.log(windowAspectRatio);
    var scrollYAtScan = 0,
        // screenMeasure = windowAspectRatio < 0.7 && isMobile ? 0.8 : 0.5; // measurement point for page progress - 0.5 = vertical center of the window.
        screenMeasure = windowAspectRatio <= 0.9 || window.innerWidth < 855 ? 0.7 : 0.5; // measurement point for page progress - 0.5 = vertical center of the window.

    function getScrollY() {
      return scrollY;
    }

    this.initBook = function (book) {
      // if we nee to run an initialize funciton on a book, this a place to do it.
      return
    }

    this.ready = function (book) {
      // another function for setting up animations -- will be useful for animating the bus along the route
      if (book.slug === 'pick') {}
    }

    this.update = function (activeBook) {
      var b = activeBook;
      if (b.slug === 'pick') {
        // create trasition
      }
    }

    this.books = [].map.call(document.querySelectorAll(".picture-book"), function(d) {
      return {
        node: d,
        slug: d.getAttribute("data-slug"),
        bgNode: d.querySelector(".picture-book-bg"),
        pages: [].map.call(d.querySelectorAll(".picture-book-page"), function(page) { return {node: page}; })
      };
    });

    this.scroll = function() {
      // console.time("scroll");
      var that = this;
      var cachedScrollY = getScrollY();
      var isFixed = false;
      var anyActiveBook = false;
      this.scan(); 
      this.books.forEach(function(book, bi) {

        var topDistance    = cachedScrollY - scrollYAtScan - book.rect.top,
            bottomDistance = cachedScrollY - scrollYAtScan - book.rect.bottom + book.bgRect.height;

        // Background fixing
        // Top
        if (topDistance <= 0 && bottomDistance <= 0) {
          book.bgNode.classList.remove("picture-book-bg-fixed");
          book.bgNode.classList.remove("picture-book-bg-bottom");
        // Bottom
        } else if (bottomDistance > 0) {
          book.bgNode.classList.remove("picture-book-bg-fixed");
          book.bgNode.classList.add("picture-book-bg-bottom");
        // Fixed
        } else {
          that.activeBook = book;
          anyActiveBook = true;
          isFixed = true;
          book.bgNode.classList.add("picture-book-bg-fixed");
          book.bgNode.classList.remove("picture-book-bg-bottom");

          // Pages
          if (book.pages.length) {

            var fp = book.pages[0];
            var lp = book.pages[book.pages.length-1];

            fp.pxPosition = fp.rect.middle-book.rect.top;
            lp.pxPosition = lp.rect.middle-book.rect.top;

            var bookProgressPx = topDistance - fp.pxPosition + book.bgRect.height/2;
            var bookLengthPx   = (book.rect.height - fp.pxPosition) - (book.rect.height-lp.pxPosition);

            book.progress = bookProgressPx/bookLengthPx;

            book.minIndex = 0;
            book.pages.forEach(function(page, pi) {

              var topDistance    = cachedScrollY - scrollYAtScan - page.rect.top    + innerHeight * screenMeasure,
                  midDistance    = cachedScrollY - scrollYAtScan - (page.rect.top+page.rect.height/2) + innerHeight * screenMeasure,
                  bottomDistance = cachedScrollY - scrollYAtScan - page.rect.bottom + innerHeight * screenMeasure;


              page.progress = (page.rect.top+page.rect.height/2)/innerHeight;
              page.midDistance = midDistance;
              if (bottomDistance >= 0) {
                page.distance = bottomDistance;
                book.minIndex = pi;
              } else if (topDistance <= 0) {
                page.distance = topDistance;
              } else if (topDistance > 0 && bottomDistance < 0) {
                page.distance = 0;
                book.minIndex = pi;
              }
            });

            book.maxIndex  = Math.min(book.minIndex + 1, book.pages.length - 1);

            book.minPage   = book.pages[book.minIndex];
            book.maxPage   = book.pages[book.maxIndex];

            book.remainder = book.minIndex === book.maxIndex ? 0 : 1 - Math.max(0, - book.minPage.distance / (book.maxPage.distance - book.minPage.distance));
            book.middleRemainder = book.minIndex === book.maxIndex ? 0 : 1 - Math.max(0, book.minPage.midDistance / innerHeight );

            book.remainder = that.easeInOutQuad(book.remainder);

            that.activePage = book.minPage;
            that.update(that.activePage);

          }
        }

      });

      if (!anyActiveBook) that.activeBook = null;

      // console.timeEnd("scroll");
    };

    this.scan = function() {
      scrollYAtScan = getScrollY();
      this.books.forEach(function(book) {
        book.rect = book.node.getBoundingClientRect();
        book.bgRect = book.bgNode.getBoundingClientRect();
        book.pages.forEach(function(page) {
          page.rect = page.node.getBoundingClientRect();
          page.rect.middle = (page.rect.top+page.rect.height/2);
          page.attributes = {};
        });
          // book.progress=(topDistance-book.bgRect.height/2)/(book.rect.height-book.bgRect.height*2);
        var fp = book.pages[0];
        var lp = book.pages[book.pages.length-1];

        book.pages.forEach(function(page) {
          // page.position = (page.rect.middle-book.rect.top)/book.rect.height;

          var attributes = page.node.attributes;

          for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var pictureBookAttribute = attribute.name.match(/^(data-pb-)(.*)$/);

            if (pictureBookAttribute) {
              var newName = pictureBookAttribute[2];
              page.attributes[newName] = attribute.value;
            }
          };

          page.position = (page.rect.middle-fp.rect.middle) / (lp.rect.middle-fp.rect.middle);

          var pageOffsets = ( innerHeight * (screenMeasure-0.5) );          
          page.position -= pageOffsets / (lp.rect.middle - fp.rect.middle);

          page.node.setAttribute("data-pb-pos",page.position)
        })
      });
    }

    this.resize = function() {
      this.scan();
      this.scroll();
    }

    this.easeLinear = function(t) { return t; }
    this.easeInOutSinusoidal = function(t) { return (Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2; }
    this.easeInQuad = function(t) { return t * t; }
    this.easeOutQuad = function(t) { return 1 - this.easeInQuad(1 - t); }
    this.easeInOutQuad = function(t) { return (t < 0.5) ? this.easeInQuad(t * 2) / 2 : 1 - this.easeInQuad((1 - t) * 2) / 2; }
    this.easeInCubic = function(t) { return Math.pow(t, 3); }
    this.easeOutCubic = function(t) { return 1 - this.easeInCubic(1 - t); }
    this.easeInOutCubic = function(t) { return (t < 0.5) ? this.easeInCubic(t * 2) / 2 : 1 - this.easeInCubic((1 - t) * 2) / 2; }


    // could wrap this in an init function
    var that = this;
    document.addEventListener("scroll", function() { that.scroll(); }, false);
    document.addEventListener("resize", function() { that.resize(); }, false);

    this.scan();


    this.books.forEach(function(book) {
      that.initBook(book);
      that.ready(book);
    });
      
    this.scroll(); // just in case user starts in middle of the page, give it an initial scroll event


};


app.reportCard = function () {
  // set up CARTO SQL for querying
  app.username = 'busworks';
  // SQL client
  app.sqlclient = new cartodb.SQL({
      user: app.username,
      protocol: "https",
      sql_api_template: "https://{user}.cartodb.com:443"
  });

  // TODO, set up route ID to be picked from a select2 box -- route ID hardcoded for now
  var route_id = 'B1';

  app.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });  

  app.map = L.map('route-map', { scrollWheelZoom: false, center: [40.7127837, -74.0059413], zoom: 10 });  

  app.map.addLayer(app.tiles);

  cartodb.createLayer(app.map, {
    user_name: app.username,
    type: 'cartodb',
    sublayers: [{
      sql: "SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'",
      cartocss: '#layer {line-width: 3;line-color: #31708f;line-opacity: 1;}'
    }]
  })
  .addTo(app.map) // add the layer to our map which already contains 1 sublayer
  .done(function(layer) {
    app.sqlclient.getBounds("SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'").done(function(bounds) {
      app.map.fitBounds(bounds)
    });

  });

  app.sqlclient.execute("SELECT * FROM table_9888036585 WHERE route_id = '"+ route_id +"'")
  .done(function(data) {
    console.log(data.rows);
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
}









