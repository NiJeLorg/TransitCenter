/*!
 * app.js: Javascript that controls the Transitcenter Public Bus Works Site
 */

function app() {}

app.init = function () {
    // set up CARTO SQL for querying
    app.username = 'busworks';
    // SQL client
    app.sqlclient = new cartodb.SQL({
        user: app.username,
        protocol: "https",
        sql_api_template: "https://{user}.cartodb.com:443"
    });

    // set up report card drop down menues
    app.createReportCardDropdowns(routeId);

    // set up listeners
    app.createListeners();

    // set up picture book
    // retired
    //app.pictureBook();

    // get random persona
    app.randomPersona();

    // set up initial report card map
    app.reportCardMap(routeId);

    // draw buses in bunching graphic
    app.bunchingBuses();

    // pull boundary values and initial route value
    app.initialDataBounds(routeId);

    //update share buttons
    app.updateShareButtons(routeId);


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
    updateTransform('ride_map_1_5_a');
    updateTransform('ride_map_1_5_b');    
    updateTransform('ride_map_2_a');
    updateTransform('ride_map_2_b');
    updateTransform('ride_map_3_5_a');
    updateTransform('ride_map_3_5_b');
    updateTransform('ride_map_3_a');
    updateTransform('ride_map_3_b');
    updateTransform('ride_map_4');
}

app.createListeners = function () {
    $(window).scroll(app.scrollingInteractions);
    $(document).ready(app.scrollingInteractions);

    if (route != "None") {
      setTimeout(function() {
        document.getElementById('report-card').scrollIntoView();
      }, 1000);
    } 

    $('a.page-scroll').bind('click', function(event) {
        event.preventDefault();
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 2000, 'easeInOutQuint');
    });

    $('#selectRoute').change(function() {
      // update map
      $('#reportCardRouteName').text($(this).val());
      app.reportCardMap($(this).val());
      // update speed number and gauge
      app.updateSpeedGuageAndText($(this).val());
      // update bunching text
      app.updateBunching($(this).val());
      // update ridership text
      app.updateRidership($(this).val());
      // update share buttons
      app.updateShareButtons($(this).val());
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

app.createReportCardDropdowns = function (route_id) {

  // get data from carto to use in report card
  app.sqlclient.execute("SELECT DISTINCT route_id FROM mta_nyct_bus_routes ORDER BY route_id")
  .done(function(data) {
    // extract results to an array for sorting
    routeIDs = [];
    for (var i = data.rows.length - 1; i >= 0; i--) {
      routeIDs.push(data.rows[i].route_id);
    }
    routeIDs.sort(naturalCompare);

    function naturalCompare(a, b) {
        var ax = [], bx = [];
        a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
        b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
        while(ax.length && bx.length) {
            var an = ax.shift();
            var bn = bx.shift();
            var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if(nn) return nn;
        }
        return ax.length - bx.length;
    }

    // loop through response to populate dropdown
    for (var i = 0; i < routeIDs.length; i++) {
      var option = $('<option/>').attr({ 'value': routeIDs[i] }).text(routeIDs[i]);
      if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'X' && routeIDs[i].charAt(2) === 'M' ) {
        $('#dropdownBXM').append(option);
      } else if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'X') {
        $('#dropdownBX').append(option);
      } else if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'M') {
        $('#dropdownBM').append(option);
      } else if (routeIDs[i].charAt(0) === 'B') {
        $('#dropdownB').append(option);
      } else if (routeIDs[i].charAt(0) === 'Q' && routeIDs[i].charAt(1) === 'M') {
        $('#dropdownQM').append(option);
      } else if (routeIDs[i].charAt(0) === 'Q') {
        $('#dropdownQ').append(option);
      } else if (routeIDs[i].charAt(0) === 'M') {
        $('#dropdownM').append(option);
      } else if (routeIDs[i].charAt(0) === 'S') {
        $('#dropdownS').append(option);
      } else {
        $('#dropdownX').append(option);
      }

    }

    // when doen create select2 menu
    app.selectRouteMenu = $("#selectRoute").select2();

    app.selectRouteMenu.on("select2:open", function (e) { 
      // add type bx placeholder text
      $(".select2-search__field").attr("placeholder", "Start typing a bus route here to search.");
    });


    // set first route 
    app.selectRouteMenu.val(route_id).trigger("change");
    
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
}

app.reportCardMap = function (route_id) {
  // make a static map using CARTO Static API
  // first get bounds for the map
  app.sqlclient.getBounds("SELECT * FROM mta_nyct_bus_routes WHERE route_id = '"+ route_id +"'")
    .done(function(bounds) {
      app.bounds = bounds;
    });

  /**** If we want to try adding labels to text layers use somethign like the following cartocss
  * text-name:[boro_name];text-face-name:'DejaVu Sans Book';text-size:50;text-fill: #6F808D;text-halo-radius: 1;text-halo-fill: rgba(255, 255, 255, 0.75);text-transform:uppercase;
  ****/ 
  var mapconfig = {
    "layers": [
/*      {
        "type": "mapnik",
        "options": {
          "sql": "SELECT * FROM nyc_borough_boundaries",
          "cartocss": "#layer {line-width: 1;line-color: #333;line-opacity: 0.9;polygon-fill: #f5f5f3;polygon-opacity:1;} ",
          "cartocss_version": "2.1.1"
        }
      },*/
      {
        "type": "http",
        "options": {
          "urlTemplate": "http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
          "subdomains": [
            "a",
            "b",
            "c"
          ]
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
      $('#route-map').html('<img class="img-responsive route-map pull-right" src="'+url+'" />');
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

}

app.initialDataBounds = function (route_id) {
  // select min and max values for speed dataset
  // min
  app.sqlclient.execute("SELECT min(speed), max(speed) FROM table_5150808763")
  .done(function(data) {
    app.minSpeed = data.rows[0].min;
    //app.minSpeed = 0;
    app.maxSpeed = data.rows[0].max;
    // set color domain for text colors
    app.speedTextColorScale.domain([app.minSpeed, app.maxSpeed]);
    // load speed data on the initially selected route
    loadRouteSpeed();
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  });

  function loadRouteSpeed() {
    app.sqlclient.execute("SELECT speed FROM table_5150808763 WHERE route_id = '"+ route_id +"'")
    .done(function(data) {
      app.routeSpeed = data.rows[0].speed.toFixed(1);
      app.initializeSpeedGauge();
      // set initial text value and color
      $('#speedNumber').text(app.routeSpeed);
      $('#speedNumber').css( "color", app.speedTextColorScale(app.routeSpeed) );
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    });   
  }

  // select min and max numbers for ridership change
  app.sqlclient.execute("SELECT min(prop_change_2010_2015), max(prop_change_2010_2015) FROM mta_nyct_bus_avg_weekday_ridership")
  .done(function(data) {
    app.minRidershipChange = data.rows[0].min * 100;
    app.maxRidershipChange = data.rows[0].max * 100;
    // set color domain for text colors
    app.ridershipChangeTextColorScale.domain([app.minRidershipChange, app.maxRidershipChange]);
    // load ridership mins and maxes, then update ridership text
    loadRidershipBounds(); 
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  }); 

  function loadRidershipBounds () {
    // select min and max numbers for ridership data
    app.sqlclient.execute("SELECT min(year_2015), max(year_2015) FROM mta_nyct_bus_avg_weekday_ridership")
    .done(function(data) {
      app.minRidership = data.rows[0].min;
      app.maxRidership = data.rows[0].max;
      // set color domain for text colors
      app.ridershipTextColorScale.domain([app.minRidership, app.maxRidership]);
      // update riderhip figures for this route
      app.updateRidership(route_id);
    })
    .error(function(errors) {
      console.log("errors:" + errors);
    }); 
  }

  // select min and max numbers for ridership data
  app.sqlclient.execute("SELECT min(prop_bunched), max(prop_bunched) FROM bunching_10_2015")
  .done(function(data) {
    app.minPropBunched = data.rows[0].min * 100;
    app.maxPropBunched = data.rows[0].max * 100;
    // set color domain for text colors
    app.bunchTextColorScale.domain([app.minPropBunched, app.maxPropBunched]);
    // set up margin and color scales for each bus
    app.bunchMarginColorScales();
    // update bunching text and graphic for this route
    app.updateBunching(route_id);
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  }); 

}

app.bunchMarginColorScales = function () {
  // calculate 5ths
  app.oneFifthPropBunched = (app.maxPropBunched - app.minPropBunched) / 5;
  app.firstFifth = app.minPropBunched + app.oneFifthPropBunched;
  app.secondFifth = app.minPropBunched + (app.oneFifthPropBunched * 2);
  app.thirdFifth = app.minPropBunched + (app.oneFifthPropBunched * 3);
  app.fourthFifth = app.minPropBunched + (app.oneFifthPropBunched * 4);
  app.fifthFifth = app.minPropBunched + (app.oneFifthPropBunched * 5);

  app.bus5ColorScale.domain([app.minPropBunched, app.firstFifth]);
  app.bus4ColorScale.domain([app.firstFifth, app.secondFifth]);
  app.bus3ColorScale.domain([app.secondFifth, app.thirdFifth]);
  app.bus2ColorScale.domain([app.thirdFifth, app.fourthFifth]);
  app.bus1ColorScale.domain([app.fourthFifth, app.fifthFifth]);

  app.bus5MarginScale.domain([app.minPropBunched, app.firstFifth]);
  app.bus4MarginScale.domain([app.firstFifth, app.secondFifth]);
  app.bus3MarginScale.domain([app.secondFifth, app.thirdFifth]);
  app.bus2MarginScale.domain([app.thirdFifth, app.fourthFifth]);
  app.bus1MarginScale.domain([app.fourthFifth, app.fifthFifth]);

}

app.updateBunching = function(route_id) {
    app.sqlclient.execute("SELECT * FROM bunching_10_2015 WHERE route_id = '"+ route_id +"'")
    .done(function(data) {
      app.propBunched = data.rows[0].prop_bunched * 100;
      app.updateBunchingText();
      app.updateBunchingGraphic();
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    }); 

}

app.updateBunchingText = function () {
  $({countNum: $('#bunchedNumber').text().replace('%','')}).animate({countNum: app.propBunched}, {
    duration: 1000,
    easing:'linear',
    step: function() {
      if (this.countNum) {
        $('#bunchedNumber').text(parseFloat(this.countNum).toFixed(1) + '%');
        $('#bunchedNumber').css( "color", app.bunchTextColorScale(this.countNum) );
      } else {
        $('#bunchedNumber').text('0%');
      }
    },
    complete: function() {
      $('#bunchedNumber').text(parseFloat(this.countNum).toFixed(1) + '%');
      $('#bunchedNumber').css( "color", app.bunchTextColorScale(this.countNum) );
    }
  });
}

/* 
  app.firstFifth = app.minPropBunched + app.oneFifthPropBunched;
  app.secondFifth = app.minPropBunched + (app.oneFifthPropBunched * 2);
  app.thirdFifth = app.minPropBunched + (app.oneFifthPropBunched * 3);
  app.fourthFifth = app.minPropBunched + (app.oneFifthPropBunched * 4);
  app.fifthFifth = app.minPropBunched + (app.oneFifthPropBunched * 5);
*/
app.updateBunchingGraphic = function () {
  if (app.propBunched <= app.firstFifth) {
    // update the margin/color for fifth bus and set the other buses to their minimum
    var color5 = app.bus5ColorScale(app.propBunched);
    var margin5 = app.bus5MarginScale(app.propBunched);

    var color4 = app.bus4ColorScale(app.firstFifth);
    var margin4 = app.bus4MarginScale(app.firstFifth);
    var color3 = app.bus3ColorScale(app.secondFifth);
    var margin3 = app.bus3MarginScale(app.secondFifth);
    var color2 = app.bus2ColorScale(app.thirdFifth);
    var margin2 = app.bus2MarginScale(app.thirdFifth);
    var color1 = app.bus1ColorScale(app.fourthFifth);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else if (app.propBunched <= app.secondFifth) {
    var color5 = app.bus5ColorScale(app.firstFifth);
    var margin5 = app.bus5MarginScale(app.firstFifth);

    var color4 = app.bus4ColorScale(app.propBunched);
    var margin4 = app.bus4MarginScale(app.propBunched);

    var color3 = app.bus3ColorScale(app.secondFifth);
    var margin3 = app.bus3MarginScale(app.secondFifth);
    var color2 = app.bus2ColorScale(app.thirdFifth);
    var margin2 = app.bus2MarginScale(app.thirdFifth);
    var color1 = app.bus1ColorScale(app.fourthFifth);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else if (app.propBunched <= app.thirdFifth) {
    var color5 = app.bus5ColorScale(app.firstFifth);
    var margin5 = app.bus5MarginScale(app.firstFifth);
    var color4 = app.bus4ColorScale(app.secondFifth);
    var margin4 = app.bus4MarginScale(app.secondFifth);

    var color3 = app.bus3ColorScale(app.propBunched);
    var margin3 = app.bus3MarginScale(app.propBunched);

    var color2 = app.bus2ColorScale(app.thirdFifth);
    var margin2 = app.bus2MarginScale(app.thirdFifth);
    var color1 = app.bus1ColorScale(app.fourthFifth);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else if (app.propBunched <= app.fourthFifth) {
    var color5 = app.bus5ColorScale(app.firstFifth);
    var margin5 = app.bus5MarginScale(app.firstFifth);
    var color4 = app.bus4ColorScale(app.secondFifth);
    var margin4 = app.bus4MarginScale(app.secondFifth);
    var color3 = app.bus3ColorScale(app.thirdFifth);
    var margin3 = app.bus3MarginScale(app.thirdFifth);

    var color2 = app.bus2ColorScale(app.propBunched);
    var margin2 = app.bus2MarginScale(app.propBunched);

    var color1 = app.bus1ColorScale(app.fourthFifth);
    var margin1 = app.bus1MarginScale(app.fourthFifth);
  } else {
    var color5 = app.bus5ColorScale(app.firstFifth);
    var margin5 = app.bus5MarginScale(app.firstFifth);
    var color4 = app.bus4ColorScale(app.secondFifth);
    var margin4 = app.bus4MarginScale(app.secondFifth);
    var color3 = app.bus3ColorScale(app.thirdFifth);
    var margin3 = app.bus3MarginScale(app.thirdFifth);
    var color2 = app.bus2ColorScale(app.fourthFifth);
    var margin2 = app.bus2MarginScale(app.fourthFifth);

    var color1 = app.bus1ColorScale(app.propBunched);
    var margin1 = app.bus1MarginScale(app.propBunched);    
  }
  // apply colors and margins
  d3.select("#useBus5").transition().duration(1000).style("fill", color5);
  d3.select("#useBus4").transition().duration(1000).style("fill", color4);
  d3.select("#useBus3").transition().duration(1000).style("fill", color3);
  d3.select("#useBus2").transition().duration(1000).style("fill", color2);
  d3.select("#useBus1").transition().duration(1000).style("fill", color1);

  margin5 = margin5 + 'px';
  margin4 = margin4 + 'px';
  margin3 = margin3 + 'px';
  margin2 = margin2 + 'px';
  margin1 = margin1 + 'px';

  d3.select("#svgBus5").transition().duration(1000).style("margin-left", margin5);
  d3.select("#svgBus4").transition().duration(1000).style("margin-left", margin4);
  d3.select("#svgBus3").transition().duration(1000).style("margin-left", margin3);
  d3.select("#svgBus2").transition().duration(1000).style("margin-left", margin2);
  d3.select("#svgBus1").transition().duration(1000).style("margin-left", margin1);

}

app.updateRidership = function(route_id) {
    app.sqlclient.execute("SELECT * FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id = '"+ route_id +"'")
    .done(function(data) {
      app.ridership = data.rows[0].year_2015;
      app.ridershipNote = data.rows[0].note;
      app.ridershipGroupRank = data.rows[0].group_rank_2015;
      app.ridershipChangeProp = data.rows[0].prop_change_2010_2015 * 100;
      app.ridershipGroupName = data.rows[0].grouping;
      app.ridershipNotes = data.rows[0].note;
      app.updateRidershipText();
      app.updateRidershipRank();
      app.updateRidershipChange();
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    }); 

}

app.updateRidershipText = function () {
  $({countNum: $('#ridershipNumber').text().replace(',','')}).animate({countNum: app.ridership}, {
    duration: 1000,
    easing:'linear',
    step: function() {
      if (this.countNum) {
        $('#ridershipNumber').text(app.numberWithCommas(parseInt(this.countNum)));
        $('#ridershipNumber').css( "color", app.ridershipTextColorScale(this.countNum) );
      } else {
        $('#ridershipNumber').text('0');
      }
    },
    complete: function() {
      $('#ridershipNumber').text(app.numberWithCommas(parseInt(this.countNum)));
      $('#ridershipNumber').css( "color", app.ridershipTextColorScale(this.countNum) );
    }
  });
  // also update the riderhsip notes field
  $('#ridershipNotes').text(app.ridershipNotes);
}

app.updateRidershipRank = function () {

  // select max ranking for the group
  app.sqlclient.execute("SELECT max(group_rank_2015) FROM mta_nyct_bus_avg_weekday_ridership WHERE grouping = '"+ app.ridershipGroupName +"'")
  .done(function(data) {
    app.maxRidershipGroup = data.rows[0].max;
    $('#ridershipMaxRank').text(parseInt(app.maxRidershipGroup));
    // set color domain for text colors
    app.ridershipRankingTextColorScale.domain([1, app.maxRidershipGroup]);
    update();
  })
  .error(function(errors) {
    console.log("errors:" + errors);
  }); 

  function update() {
    $({countNum: parseInt($('#ridershipRanking').text())}).animate({countNum: app.ridershipGroupRank}, {
      duration: 1000,
      easing:'linear',
      step: function() {
        if (this.countNum) {
          $('#ridershipRanking').text(app.ordinal_suffix_of(parseInt(this.countNum)));
          $('#ridershipRanking').css( "color", app.ridershipRankingTextColorScale(this.countNum) );
        } else {
          $('#ridershipRanking').text('1');
        }
      },
      complete: function() {
        $('#ridershipRanking').text(app.ordinal_suffix_of(parseInt(this.countNum)));
        $('#ridershipRanking').css( "color", app.ridershipRankingTextColorScale(this.countNum) );
      }
    });   
  }

  // update the group name
  $('#ridershipGroup').text(app.ridershipGroupName);

}

app.updateRidershipChange = function () {
  // instead of using the app.ridershipChangeTextColorScale, just show green if growth in ridership and red if loss in ridership
  $({countNum: parseFloat($('#ridershipChange').text())}).animate({countNum: app.ridershipChangeProp}, {
    duration: 1000,
    easing:'linear',
    step: function() {
      if (this.countNum) {
        if (this.countNum >= 0) {
          $('#ridershipChange').text(parseFloat(this.countNum).toFixed(1) + '% increase');
          $('#ridershipChange').css( "color", '#3c763d' );
        } else {
          $('#ridershipChange').text(Math.abs(parseFloat(this.countNum)).toFixed(1) + '% decrease');
          $('#ridershipChange').css( "color", '#a94442' );          
        }
      } else {
        $('#ridershipChange').text('0% increase');
      }
    },
    complete: function() {
      if (this.countNum >= 0) {
        $('#ridershipChange').text(parseFloat(this.countNum).toFixed(1) + '% increase');
        $('#ridershipChange').css( "color", '#3c763d' );
      } else {
        $('#ridershipChange').text(Math.abs(parseFloat(this.countNum)).toFixed(1) + '% decrease');          
        $('#ridershipChange').css( "color", '#a94442' );          
      }
    }
  });
}

app.initializeSpeedGauge = function() {
    // set up report card speed gauge
  app.speedGaugeObject = app.speedGauge('#speed-gauge', {
    size: 200,
    clipWidth: 200,
    clipHeight: 120,
    ringWidth: 60,
    minValue: Math.floor(app.minSpeed),
    maxValue: Math.ceil(app.maxSpeed),
    transitionMs: 2000,
    majorTicks: 500,
    pointerHeadLengthPercent: 0.85,
  });
  app.speedGaugeObject.render();
  // add initial speed object
  app.speedGaugeObject.update(app.routeSpeed);
  // update speed number
  $('#speedNumber').text(app.routeSpeed);
}

app.updateSpeedGuageAndText = function(route_id) {
  app.sqlclient.execute("SELECT speed FROM table_5150808763 WHERE route_id = '"+ route_id +"'")
  .done(function(data) {
    app.routeSpeed = data.rows[0].speed.toFixed(1);
    // update speed number and gauge
    app.updateSpeedText(app.routeSpeed);
    if (typeof app.speedGaugeObject !== 'undefined') {
      app.speedGaugeObject.update(app.routeSpeed);
    }   
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  }); 
}

app.updateSpeedText = function (newSpeed) {
  $({countNum: $('#speedNumber').text()}).animate({countNum: newSpeed}, {
    duration: 1000,
    easing:'linear',
    step: function() {
      if (this.countNum) {
        $('#speedNumber').text(parseFloat(this.countNum).toFixed(1));
        $('#speedNumber').css( "color", app.speedTextColorScale(this.countNum) );
      } else {
        $('#speedNumber').text('0');
      }
    },
    complete: function() {
      $('#speedNumber').text(parseFloat(this.countNum).toFixed(1));
      $('#speedNumber').css( "color", app.speedTextColorScale(this.countNum) );
    }
  });
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
    
    transitionMs        : 1000,
    
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
  var arcLabels = undefined;
  var scale = undefined;
  var ticks = undefined;
  var tickData = undefined;
  var pointer = undefined;

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

    // arcs for text labels
    arcLabels = d3.svg.arc()
      .innerRadius(r - config.ringWidth + 10)
      .outerRadius(r - config.ringInset + 10)
      .startAngle(-90 * (Math.PI/180))
      .endAngle(90 * (Math.PI/180));

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

    // arc for labels
    var arcText = svg.append('g')
        .attr('transform', centerTx);
    arcText.append("path")
        .attr("id", "curve")
        .attr("d", arcLabels)
        .attr('fill', 'none');
    
    var avgSpeed = config.maxValue/2;
    //var labels = [['6%','Slowest'],['27%', 'Median Bus'],['49%', 'Fastest']];
    var labels = [['9.5%','Slowest Bus'],['45.5%', 'Fastest Bus']];
    var lg = svg.append('g')
        .attr('class', 'label')
        .attr('transform', centerTx);
    lg.selectAll('text')
        .data(labels)
      .enter().append('text')
/*        .attr('transform', function(d) {
          console.log(d[0]);
          var ratio = scale(d[0]);
          var newAngle = config.minAngle + (ratio * range);
          return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
        })*/
        .append("textPath")
        .attr('startOffset', function(d) { return d[0] })
        .attr("xlink:href", "#curve")
        .text(function(d) { return d[1] });


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


// retired
/*app.delayBar = function () {
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
}*/

app.bunchingBuses = function () { 
  app.bus1 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus1")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus1.append("use")
    .attr("id", "useBus1")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus2 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus2")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus2.append("use")
    .attr("id", "useBus2")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus3 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus3")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus3.append("use")
    .attr("id", "useBus3")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus4 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus4")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus4.append("use")
    .attr("id", "useBus4")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );

  app.bus5 = d3.select("#mini-buses")
    .append("svg")
    .attr("id", "svgBus5")
    .attr("width", "50px")
    .attr("height", "17px")
    .attr("viewBox", "0 0 729.2 244")
    .attr("xlink:href", "http://www.w3.org/1999/xlink");

  app.bus5.append("use")
    .attr("id", "useBus5")
    .attr("xlink:href", "#bus_icon" )
    .attr("x", "0" )
    .attr("y", "0" );
}


// picture book scrolling code
// retired
/*app.pictureBook = function () {

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
};*/

app.numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

app.ordinal_suffix_of = function (i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}


// color ranges for text. Set domains based on data above
app.speedTextColorScale = d3.scale.linear()
  .range(['#a94442','#3c763d']);

app.ridershipTextColorScale = d3.scale.linear()
  .range(['#a94442','#3c763d']);

app.ridershipRankingTextColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.ridershipChangeTextColorScale = d3.scale.linear()
  .range(['#a94442','#3c763d']);

app.bunchTextColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.bus1ColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.bus2ColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.bus3ColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.bus4ColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.bus5ColorScale = d3.scale.linear()
  .range(['#3c763d','#a94442']);

app.bus1MarginScale = d3.scale.linear()
  .range([20, 2]);

app.bus2MarginScale = d3.scale.linear()
  .range([20, 2]);

app.bus3MarginScale = d3.scale.linear()
  .range([20, 2]);

app.bus4MarginScale = d3.scale.linear()
  .range([20, 2]);

app.bus5MarginScale = d3.scale.linear()
  .range([20, 2]);


// share buttons
app.updateShareButtons = function (route_id) {
  // set up twitter and facebook URLs
  var app_id = '1581540325487727';
  var fbdescription = "Here's the report card for the " + route_id + " bus in NYC. Check out and compare your bus here!";
  var fblink = "http://busturnaround.nyc/?route="+route_id;
  var fbpicture = "http://busturnaround.nyc/static/website/css/images/report_card_fb.png";
  var fbname = "This is the report card for the "+route_id;
  var fbcaption = "TransitCenter";
  var fbUrl = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&display=popup&description='+ encodeURIComponent(fbdescription) + '&link=' + encodeURIComponent(fblink) + '&redirect_uri=' + encodeURIComponent(fblink) + '&name=' + encodeURIComponent(fbname) + '&caption=' + encodeURIComponent(fbcaption) + '&picture=' + encodeURIComponent(fbpicture);
  var fbOnclick = 'window.open("' + fbUrl + '","facebook-share-dialog","width=626,height=436");return false;';
  //$('#showShareFB').attr("href", fbUrl);
  $('#showShareFB').attr("onclick", fbOnclick);


  var twitterlink = "http://busturnaround.nyc/?route="+route_id;
  var via = 'TransitCenter';
  var twittercaption = "Here's the report card for the " + route_id + " bus in NYC. Check out and compare your bus here!";
  var twitterUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(twitterlink) + '&via='+ encodeURIComponent(via) + '&text=' + encodeURIComponent(twittercaption);
  var twitterOnclick = 'window.open("' + twitterUrl + '","twitter-share-dialog","width=626,height=436");return false;';
  //$('#showShareTwitter').attr("href", twitterUrl);
  $('#showShareTwitter').attr("onclick", twitterOnclick);
}


