/*!
 * app.js: Javascript that controls the Transitcenter Public Bus Works Site
 */

function app() {}

app.init = function () {

    // set up select 2 menu for route reprot card
    $("#selectRoute").select2();

    // set up listeners
    app.createListeners();

    // set up picture book
    // retired
    //app.pictureBook();

    // get random persona
    app.randomPersona();

    // set up report card Map
    app.reportCardMap('BX1');

    // set up report card speed gauge
    app.speedGaugeObject = app.speedGauge('#speed-gauge', {
      size: 200,
      clipWidth: 200,
      clipHeight: 120,
      ringWidth: 60,
      maxValue: 10,
      transitionMs: 2000,
    });
    app.speedGaugeObject.render();
    // hardcode first speef object
    app.speedGaugeObject.update(4.5);

    // set up delay bar
    app.delayBar();

}

app.scrollingInteractions = function () {
    // get height of intro block
    var introHeight = $(".intro").height();
    if ($("#fixedNav").offset().top >= introHeight) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }

    function updateTransform (element) {
      var offsetTop = $('#'+element).offset().top;
      if (checkScroll(offsetTop)) {
        var dest = getTraslateY(offsetTop);
        $('#'+element+' .ride-translate-wrapper').css('transform', 'translateY(' + dest + 'px)');
      } else {
        $('#'+element+' .ride-translate-wrapper').css('transform', 'translateY(0px)');      
      }
    }

    function getTraslateY(element) {
      return (scrollY - element)/1.5;
    }
    function checkScroll(target) {
      if (scrollY >= target) {
        return true;
      } else {
        return false;
      }
    }
 
    updateTransform('ride');
    updateTransform('ride_map_1_b');
    updateTransform('ride_map_2_a');
    updateTransform('ride_map_2_b');
    updateTransform('ride_map_3_a');
    updateTransform('ride_map_3_b');


}

app.createListeners = function () {
    $(window).scroll(app.scrollingInteractions);
    $(document).ready(app.scrollingInteractions);

    $('a.page-scroll').bind('click', function(event) {
        event.preventDefault();
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 2000, 'easeInOutQuint');
    });

    $('#selectRoute').change(function() {
      $('#reportCardRouteName').text($(this).val());
      app.reportCardMap($(this).val());
      var speedNumber = (Math.random() * 10).toFixed(1);
      $('#speedNumber').text(speedNumber);
      app.speedGaugeObject.update(speedNumber);
    });

}

app.randomPersona = function () {
  var randInt = app.getRandomInt(1,3);
  if (randInt == 1) {
    $('#persona-image1').attr("src","/static/website/css/images/scene_start_grandma.png");
    $('#persona-image2').attr("src","/static/website/css/images/goal_grandma.png");
    $('#persona-1-a').attr("src","/static/website/css/images/scene_LATEright_grandma.png");    
    $('#persona-1-5-a').attr("src","/static/website/css/images/handcountingchange_grandma.png");
    $('#persona-1-5-b').attr("src","/static/website/css/images/contactlesscard_grandma.png");
    $('#persona-3-a').attr("src","/static/website/css/images/sad_grandma.png");
    $('#persona-3-b').attr("src","/static/website/css/images/happy_grandma.png");
    $('#persona-4').attr("src","/static/website/css/images/goal_grandma.png");
    $('#personaDescriptionText').text("Meet Sophia, a grandparent patiently waiting for the bus to take them to their grandchild's birthday party.");
    $('.personaName').text("Sophia");
  } else if (randInt == 2) {
    $('#persona-image1').attr("src","/static/website/css/images/scene_start_nurse.png");
    $('#persona-image2').attr("src","/static/website/css/images/goal_nurse.png");
    $('#persona-1-a').attr("src","/static/website/css/images/scene_LATEright_nurse.png");    
    $('#persona-1-5-a').attr("src","/static/website/css/images/handcountingchange_nurse.png");
    $('#persona-1-5-b').attr("src","/static/website/css/images/contactlesscard_nurse.png");
    $('#persona-3-a').attr("src","/static/website/css/images/sad_nurse.png");
    $('#persona-3-b').attr("src","/static/website/css/images/happy_nurse.png");
    $('#persona-4').attr("src","/static/website/css/images/goal_nurse.png");
    $('#personaDescriptionText').text("Meet Daniel, a nurse patiently waiting for the bus to take them to the hospital where they work.");
    $('.personaName').text("Daniel");
  } else {
    $('#persona-image1').attr("src","/static/website/css/images/scene_start_student.png");
    $('#persona-image2').attr("src","/static/website/css/images/goal_student.png");
    $('#persona-1-a').attr("src","/static/website/css/images/scene_LATEright_student.png");    
    $('#persona-1-5-a').attr("src","/static/website/css/images/handcountingchange_student.png");
    $('#persona-1-5-b').attr("src","/static/website/css/images/contactlesscard_student.png");
    $('#persona-3-a').attr("src","/static/website/css/images/sad_student.png");
    $('#persona-3-b').attr("src","/static/website/css/images/happy_student.png");
    $('#persona-4').attr("src","/static/website/css/images/goal_student.png");
    $('#personaDescriptionText').text("Meet Olivia, a student patiently waiting for the bus to take them to their final exams.");
    $('.personaName').text("Olivia");
  }
}

app.getRandomInt = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


app.reportCardMap = function (route_id) {
  // set up CARTO SQL for querying
  app.username = 'busworks';
  // SQL client
  app.sqlclient = new cartodb.SQL({
      user: app.username,
      protocol: "https",
      sql_api_template: "https://{user}.cartodb.com:443"
  });

  // TODO, set up route ID to be picked from a select2 box -- route ID hardcoded for now

  // make a static map using CARTO Static API
  // first get bounds for the map
  app.sqlclient.getBounds("SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'")
    .done(function(bounds) {
      console.log(bounds);
      app.bounds = bounds;
    });

  /**** If we want to try adding labels to text layers use somethign like the following cartocss
  * text-name:[boro_name];text-face-name:'DejaVu Sans Book';text-size:50;text-fill: #6F808D;text-halo-radius: 1;text-halo-fill: rgba(255, 255, 255, 0.75);text-transform:uppercase;
  ****/ 
  var mapconfig = {
    "layers": [
      {
        "type": "mapnik",
        "options": {
          "sql": "SELECT * FROM nyc_borough_boundaries",
          "cartocss": "#layer {line-width: 1;line-color: #333;line-opacity: 0.9;polygon-fill: #f5f5f3;polygon-opacity:1;} ",
          "cartocss_version": "2.1.1"
        }
      },
      {
        "type": "mapnik",
        "options": {
          "sql": "SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'",
          "cartocss": "#layer {line-width: 5;line-color: #31708f;line-opacity: 1;} ",
          "cartocss_version": "2.1.1"
        }
      },
    ]
  }

  $.ajax({
    crossOrigin: true,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    url: 'https://'+app.username+'.carto.com/api/v1/map',
    data: JSON.stringify(mapconfig),
    success: function(data) {
      // url of the form /api/v1/map/static/bbox/{token}/{bbox}/{width}/{height}.{format}
      // https://carto.com/docs/carto-engine/maps-api/static-maps-api/#bounding-box
      var url = 'https://'+app.username+'.carto.com/api/v1/map/static/bbox/'+data.layergroupid+'/'+app.bounds[1][1]+','+app.bounds[1][0]+','+app.bounds[0][1]+','+app.bounds[0][0]+'/792/1224.png';
      // get map image
      $('#route-map').html('<img class="img-responsive" src="'+url+'" />');
    }

  });


/*  app.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });  

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

  });*/


  // get data from carto to use in report card
  app.sqlclient.execute("SELECT * FROM table_9888036585 WHERE route_id = '"+ route_id +"'")
  .done(function(data) {
    console.log(data.rows);
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
}

app.speedGauge = function (container, configuration) {
  var that = {};
  var config = {
    size              : 200,
    clipWidth         : 200,
    clipHeight        : 110,
    ringInset         : 20,
    ringWidth         : 20,
    
    pointerWidth        : 10,
    pointerTailLength     : 5,
    pointerHeadLengthPercent  : 0.9,
    
    minValue          : 0,
    maxValue          : 10,
    
    minAngle          : -90,
    maxAngle          : 90,
    
    transitionMs        : 750,
    
    majorTicks          : 5,
    labelFormat         : d3.format(',g'),
    labelInset          : 10,
    
    arcColorFn          : d3.interpolateHsl(d3.rgb('#FF4000'), d3.rgb('#5BCF59'))
  };
  var range = undefined;
  var r = undefined;
  var pointerHeadLength = undefined;
  var value = 0;
  
  var svg = undefined;
  var arc = undefined;
  var scale = undefined;
  var ticks = undefined;
  var tickData = undefined;
  var pointer = undefined;
  console.log(d3);

  var donut = d3.layout.pie();
  
  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }
  
  function newAngle(d) {
    var ratio = scale(d);
    var newAngle = config.minAngle + (ratio * range);
    return newAngle;
  }
  
  function configure(configuration) {
    var prop = undefined;
    for ( prop in configuration ) {
      config[prop] = configuration[prop];
    }
    
    range = config.maxAngle - config.minAngle;
    r = config.size / 2;
    pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

    // a linear scale that maps domain values to a percent from 0..1
    scale = d3.scale.linear()
      .range([0,1])
      .domain([config.minValue, config.maxValue]);
      
    ticks = scale.ticks(config.majorTicks);
    tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});
    
    arc = d3.svg.arc()
      .innerRadius(r - config.ringWidth - config.ringInset)
      .outerRadius(r - config.ringInset)
      .startAngle(function(d, i) {
        var ratio = d * i;
        return deg2rad(config.minAngle + (ratio * range));
      })
      .endAngle(function(d, i) {
        var ratio = d * (i+1);
        return deg2rad(config.minAngle + (ratio * range));
      });
  }
  that.configure = configure;
  
  function centerTranslation() {
    return 'translate('+r +','+ r +')';
  }
  
  function isRendered() {
    return (svg !== undefined);
  }
  that.isRendered = isRendered;
  
  function render(newValue) {
    svg = d3.select(container)
      .append('svg:svg')
        .attr('class', 'gauge')
        .attr('width', config.clipWidth)
        .attr('height', config.clipHeight);
    
    var centerTx = centerTranslation();
    
    var arcs = svg.append('g')
        .attr('class', 'arc')
        .attr('transform', centerTx);
    
    arcs.selectAll('path')
        .data(tickData)
      .enter().append('path')
        .attr('fill', function(d, i) {
          return config.arcColorFn(d * i);
        })
        .attr('d', arc);
    
    var lg = svg.append('g')
        .attr('class', 'label')
        .attr('transform', centerTx);
    lg.selectAll('text')
        .data(ticks)
      .enter().append('text')
        .attr('transform', function(d) {
          var ratio = scale(d);
          var newAngle = config.minAngle + (ratio * range);
          return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
        })
        .text(config.labelFormat);

    var lineData = [ [config.pointerWidth / 2, 0], 
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0] ];
    var pointerLine = d3.svg.line().interpolate('monotone');
    var pg = svg.append('g').data([lineData])
        .attr('class', 'pointer')
        .attr('transform', centerTx);
        
    pointer = pg.append('path')
      .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
      .attr('transform', 'rotate(' +config.minAngle +')');
      
    update(newValue === undefined ? 0 : newValue);
  }
  that.render = render;
  
  function update(newValue, newConfiguration) {
    if ( newConfiguration  !== undefined) {
      configure(newConfiguration);
    }
    var ratio = scale(newValue);
    var newAngle = config.minAngle + (ratio * range);
    pointer.transition()
      .duration(config.transitionMs)
      .ease('elastic')
      .attr('transform', 'rotate(' +newAngle +')');
  }
  that.update = update;

  configure(configuration);
  
  return that;
}

app.delayBar = function () {
  var value = parseInt(113);
  var valuePrint = value;

  //create svg for most recent sample
  var scale = d3.scale.linear()
          .domain([0, 400])
          .range([0, 200]);

      var firstPoint = scale(value) + 10;
      var secondPoint = scale(value) + 20;
      var thirdPoint = scale(value) + 15;
      var delayAnchor = scale(275) + 15;
      var scheduleAnchor = scale(75) + 15;

      var points =  firstPoint + ",15 " + secondPoint + ",15 " + thirdPoint + ", 25";

  var delayBar = d3.select("#delay-bar")
    .append('svg')
    .attr('width', 200)
    .attr('height', 60);

  delayBar.append('rect')
    .attr('width', scale(400))
    .attr('height', 6)
    .attr('x', 0)
    .attr('y', 20)
    .attr('style', 'fill: #FF4000');

  delayBar.append('rect')
    .attr('width', scale(200))
    .attr('height', 6)
    .attr('x', 0)
    .attr('y', 20)
    .attr('style', 'fill: #5BCF59');

  delayBar.append('polygon')
    .attr('points', points)
    .attr('style', 'fill: #545454');

  delayBar.append("text")
    .attr("text-anchor", "middle")
    .attr("dx", scheduleAnchor)
    .attr("dy", 40)
    .attr('style', "font-size: 14px;")
    .text('Schedule');

  delayBar.append("text")
    .attr("text-anchor", "middle")
    .attr("dx", delayAnchor)
    .attr("dy", 40)
    .attr('style', "font-size: 14px;")
    .text('Delay');     
}


// picture book scrolling code
// retired
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








