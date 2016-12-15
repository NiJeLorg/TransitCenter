/*!
 * district_app.js: Javascript that controls the Transitcenter Distrct Level Analysis Page
 */

function app() {}

app.init = function() {
    // set up CARTO SQL for querying
    app.username = 'busworks';
    // SQL client
    app.sqlclient = new cartodb.SQL({
        user: app.username,
        protocol: "https",
        sql_api_template: "https://{user}.cartodb.com:443"
    });

    // pull district number out of global district variable -- use this number on initial page load
    app.districtNumber = district.replace( /^\D+/g, '');
    app.districtName = district.replace(/\d+/g, '');
    app.firstRun = true;

    // set up listeners
    app.createListeners();

    // set up report card drop down menu
   	app.initSelect2MenuDistrictName();

    // enable bootstrap tooltips
    $('[data-toggle="tooltip"]').tooltip();

};

// sets up listeners
app.createListeners = function() {

    // listen for on change to update dropdown menu
    $('#selectDistrict').change(function() {
        app.districtName = $(this).val();
        // update route selection and data
        app.updateNumberDropdown();
    });

    // listen for on change to update visualizations
    $('#number').change(function() {
        app.districtNumber = $(this).val();
        // add loading modal
        $("body").addClass("loading");
        // update route selection and data

        app.selectRoutes();
        // create url parameters
        window.history.pushState( {} , '', '?district=' + $('#selectDistrict').val() + $('#number').val() );
    });
}

app.updateNumberDropdown = function() {
    // clear numbers and destroy select2 box if neccesary
    if ($("#number").hasClass("select2-hidden-accessible")) {
        $("#number").select2("destroy");
    }

    $("#number").html('');
    // select district table and field names
    if (app.districtName == 'senate') {
        // State Sentate
        app.districtTable = 'nyc_state_senate_districts';
        app.districtFieldName = 'stsendist';
        app.printDistrict = 'State Senate District';
    } else if (app.districtName == 'assembly') {
        // State Assembly
        app.districtTable = 'nyc_state_assembly_districts';
        app.districtFieldName = 'assem_dist';
        app.printDistrict = 'State Assembly District';
    } else if (app.districtName == 'council') {
        // City Council
        app.districtTable = 'nyc_city_council_districts';
        app.districtFieldName = 'coun_dist';
        app.printDistrict = 'City Council District';
    } else {
         // Community Board
        app.districtTable = 'nyc_community_districts';
        app.districtFieldName = 'boro_cd';
        app.printDistrict = 'Community Board District';
    }
    // update number dropdown menu
    app.createNumberOptions();

}

/**** Create select2 drop down menu ****/
app.createNumberOptions = function() {

    // first pull state assembly districts and append
    var sql = "SELECT "+ app.districtFieldName +" FROM "+ app.districtTable +" ORDER BY "+ app.districtFieldName;
    app.sqlclient.execute(sql)
        .done(function(data) {

            // loop through response to populate dropdown
            for (var i = 0; i < data.rows.length; i++) {
                var option = $('<option/>').attr({ 'value': data.rows[i][app.districtFieldName] }).text(data.rows[i][app.districtFieldName]);
                $('#number').append(option);
            }

            app.initSelect2MenuDistrictNumber();

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
}


app.initSelect2MenuDistrictName = function() {
	// when done create select2 menu
	// if mobile, skip setting up select 2
	if (($('body')).width() < 767) {
	    $("#selectDistrict").val(app.districtName);
        app.updateNumberDropdown();
	} else {
	    app.selectDistrictMenu = $("#selectDistrict").select2();
	    app.selectDistrictMenu.val(app.districtName).trigger("change");
	}
}

app.initSelect2MenuDistrictNumber = function() {
    // which district number should we use?
    console.log(app.firstRun);
    if (!app.firstRun) {
        app.districtNumber = $("#number").val();
    }
    console.log(app.districtNumber);

    // when done create select2 menu
    // if mobile, skip setting up select 2
    if (($('body')).width() < 767) {
        $("#number").val(app.districtNumber);
        app.selectRoutes();
    } else {
        app.selectDistrictNumberMenu = $("#number").select2();
        app.selectDistrictNumberMenu.val(app.districtNumber).trigger("change");
    }

    // after first run, set app.firstRun = false;
     app.firstRun = false;
}
/********/

// SQL set up to select routes from selected district
app.selectRoutes = function() {
	// get district number with regex
	var districtNumber = $("#number").val();

	// set up query to pull geometry for district

    var districtGeomSQL = 'SELECT district.the_geom FROM '+ app.districtTable +' AS district WHERE '+ app.districtFieldName +' = ' + districtNumber;


	// now select the distinct routes that intersect that geometry
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BX%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND ST_Intersects( mta.the_geom , ("+ districtGeomSQL +") )";

    // pass routesWithinSQL to bar chart update function
    app.updateBarCharts(routesWithinSQL);

    // update data vis text
    app.updateTextDataVis(routesWithinSQL, districtGeomSQL);


    var districtMapSQL = 'SELECT * FROM '+ app.districtTable +' AS district WHERE '+ app.districtFieldName +' = ' + districtNumber;

    var routesMapSQL = 'SELECT * FROM mta_nyct_bus_routes WHERE route_id IN ('+ routesWithinSQL +')';

    // update the map
    // interactive
    app.reportCardMap(districtMapSQL, routesMapSQL);

    //static
    app.reportCardMapStatic(districtMapSQL, routesMapSQL);

}

// pull data and update text based on selected district
app.updateTextDataVis = function(routesWithinSQL, districtGeomSQL) {
	// set district name

	$('#districtName').text(app.printDistrict + ' ' + app.districtNumber);


	// calculate bus commuters based on census block group data
	var commuterQuery = 'SELECT sum(acs.hd01_vd11) FROM acs_14_5yr_b08301 AS acs WHERE ST_Intersects( acs.the_geom , ('+ districtGeomSQL +') )';

    app.activeAjaxConnections++;
    app.sqlclient.execute(commuterQuery)
        .done(function(data) {
            app.activeAjaxConnections--;

            $({countNum: $('#busCommuters').text().replace(',','')}).animate({countNum: data.rows[0].sum}, {
              duration: 1000,
              easing:'linear',
              step: function() {
                if (this.countNum) {
                  $('#busCommuters').text(app.numberWithCommas(parseInt(this.countNum)));
                } else {
                  $('#busCommuters').text('0');
                }
              },
              complete: function() {
               $('#busCommuters').text(app.numberWithCommas(parseInt(this.countNum)));
                if (app.activeAjaxConnections == 0) {
                    $("body").removeClass("loading");
                }
              }
            });
        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


 	// calculate number of bus routes that fall within this district
    app.activeAjaxConnections++;
    app.sqlclient.execute(routesWithinSQL)
        .done(function(data) {
            app.activeAjaxConnections--;

        	// pull total_rows from response
		    $({countNum: $('#busRoutes').text()}).animate({countNum: data.total_rows}, {
		      duration: 1000,
		      easing:'linear',
		      step: function() {
		        if (this.countNum) {
		          $('#busRoutes').text(parseInt(this.countNum));
		        } else {
		          $('#busRoutes').text('0');
		        }
		      },
		      complete: function() {
		       $('#busRoutes').text(parseInt(this.countNum));
                if (app.activeAjaxConnections == 0) {
                    $("body").removeClass("loading");
                }
		      }
		    });

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // calculate poverty level based on census block group data
    var poveryQuery = 'SELECT sum(acs.hd01_vd01) as total, sum(acs.hd01_vd02) as poor FROM acs_14_5yr_b17021 AS acs WHERE ST_Intersects( acs.the_geom , ('+ districtGeomSQL +') )';
    var pctPoor;
    app.activeAjaxConnections++;
    app.sqlclient.execute(poveryQuery)
        .done(function(data) {
            app.activeAjaxConnections--;
            pctPoor = parseInt(((data.rows[0].poor / data.rows[0].total) * 100).toFixed())

            $({countNum: $('#percentPoverty').text()}).animate({countNum: pctPoor}, {
              duration: 1000,
              easing:'linear',
              step: function() {
                if (this.countNum) {
                  $('#percentPoverty').text(parseInt(this.countNum));
                } else {
                  $('#percentPoverty').text('0');
                }
              },
              complete: function() {
               $('#percentPoverty').text(parseInt(this.countNum));
                if (app.activeAjaxConnections == 0) {
                    $("body").removeClass("loading");
                }
              }
            });
        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

}

// pull data and creates bar charts for selected district
app.updateBarCharts = function(routesWithinSQL) {

    // using the routes selected by district, build a query for top three routes in ridership
	var ridershipQuery = 'SELECT route_id, year_2015, note FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN ('+ routesWithinSQL +') AND year_2015 IS NOT NULL ORDER BY year_2015 DESC LIMIT 3 ';

    app.activeAjaxConnections++;
    app.sqlclient.execute(ridershipQuery)
        .done(function(data) {
            app.activeAjaxConnections--;
            if (app.activeAjaxConnections == 0) {
                $("body").removeClass("loading");
            }

        	// create data object and pass to bar chart for the form
        	//var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
        	var ridershipArray = [];
            var ridershipNotesArray = [];
            var label;
        	for (var i = 0; i < data.rows.length; i++) {
                if (data.rows[i].note) {
                    ridershipNotesArray.push(data.rows[i].note);
                    label = data.rows[i].route_id + '*'
                } else {
                    label = data.rows[i].route_id;
                }
        		ridershipArray.push({ label: label, value: data.rows[i].year_2015 });

        	}

    		app.createBarChart('#ridership', app.greenColorScale, ridershipArray);
            app.createNotesForRidershipBarChart(ridershipNotesArray);


        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // using the routes selected by district, build a query for top three routes by fastest growing
	var fastestGrowingQuery = 'SELECT route_id, prop_change_2010_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN ('+ routesWithinSQL +') AND prop_change_2010_2015 >= 0 AND prop_change_2010_2015 IS NOT NULL ORDER BY prop_change_2010_2015 DESC LIMIT 3 ';


    app.activeAjaxConnections++;
    app.sqlclient.execute(fastestGrowingQuery)
        .done(function(data) {
            app.activeAjaxConnections--;
            if (app.activeAjaxConnections == 0) {
                $("body").removeClass("loading");
            }

        	// create data object and pass to bar chart for the form
        	//var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
        	var fastestGrowingArray = [];
        	var pct;
        	for (var i = 0; i < data.rows.length; i++) {
        		pct = parseFloat((data.rows[i].prop_change_2010_2015 * 100).toFixed());
        		fastestGrowingArray.push({ label: data.rows[i].route_id, value: pct });
        	}

    		app.createBarChart('#fastestGrowing', app.greenColorScale, fastestGrowingArray);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

    // using the routes selected by district, build a query for top three routes by most bunching
	var mostBunchingQuery = 'SELECT route_id, prop_bunched FROM bunching_10_2015_05_2016 WHERE route_id IN ('+ routesWithinSQL +') AND prop_bunched IS NOT NULL ORDER BY prop_bunched DESC LIMIT 3';

    app.activeAjaxConnections++;
    app.sqlclient.execute(mostBunchingQuery)
        .done(function(data) {
            app.activeAjaxConnections--;
            if (app.activeAjaxConnections == 0) {
                $("body").removeClass("loading");
            }

        	// create data object and pass to bar chart for the form
        	//var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
        	var mostBunchingArray = [];
        	var pct;
        	for (var i = 0; i < data.rows.length; i++) {
        		pct = parseFloat((data.rows[i].prop_bunched * 100).toFixed(1));
        		mostBunchingArray.push({ label: data.rows[i].route_id, value: pct });
        	}

    		app.createBarChart('#mostBunching', app.mostBunchingColorScale, mostBunchingArray);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // using the routes selected by district, build a query for top three slowest routes
	var slowestQuery = 'SELECT route_id, speed FROM speed_by_route_10_2015_05_2016 WHERE route_id IN ('+ routesWithinSQL +') AND speed IS NOT NULL ORDER BY speed ASC LIMIT 3';

    app.activeAjaxConnections++;
    app.sqlclient.execute(slowestQuery)
        .done(function(data) {
            app.activeAjaxConnections--;
            if (app.activeAjaxConnections == 0) {
                $("body").removeClass("loading");
            }

        	// create data object and pass to bar chart for the form
        	//var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
        	var slowestArray = [];
        	var num;
        	for (var i = 0; i < data.rows.length; i++) {
        		num = parseFloat(data.rows[i].speed.toFixed(1));
        		slowestArray.push({ label: data.rows[i].route_id, value: num });
        	}

    		app.createBarChart('#slowest', app.slowestColorScale, slowestArray);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


}

app.createBarChart = function(divId, barChartColorScale, data) {
	// for now, destroy previous bar chart
	$(divId).html('');

    var arr = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (typeof data[i][key] === 'number') {
                arr.push(data[i][key]);
            }
        }
    }

    // D3 color scales
    app.greenColorScale.domain([0, d3.max(arr)]);
    app.mostBunchingColorScale.domain([0, d3.max(arr)]);
    app.slowestColorScale.domain([0, d3.max(arr)]);

    var width = $('.bus-routes-bars .col-md-6').width(),
        barHeight = 25,
        barWidth = width * (3 / 4);

    var x = d3.scale.linear()
        .domain([0, d3.max(arr)])
        .range([barWidth/4, barWidth]);

    var chart = d3.select(divId)
        .append('svg')
        .attr("width", width)
        .attr("height", barHeight * data.length);

    var bar = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * barHeight + ")";
        });

    bar.append("rect")
        .attr('fill', function(d) {
            return barChartColorScale(d.value);
        })
        .attr("width", function(d, i) {
            return x(d.value) - 3;
        })
        .attr("height", barHeight - 5);

    bar.append("text")
        .attr("class", "inside-bar-text")
        .attr("x", function(d) {
            return x(d.value) - 10;
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            if (divId === '#fastestGrowing' || divId === '#mostBunching') {
                return d.value + '%';
            } else if (divId === '#slowest') {
                return d.value + ' mph';
            }
            return app.numberWithCommas(d.value);
        });
    bar.append("text")
        .attr("class", "outside-bar-text")
        .attr("x", function(d) {
            return x(d.value) + 3;
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.label;
        });
};

app.createNotesForRidershipBarChart = function(ridershipNotesArray) {
    // clear previous notes
    $('#ridershipNotes').html('');
    for (var i = ridershipNotesArray.length - 1; i >= 0; i--) {
        $('#ridershipNotes').append( "<p><sup>*</sup>"+ ridershipNotesArray[i] +"</p>" );
    }
}


// interactive map
app.reportCardMap = function (districtMapSQL, routesMapSQL) {

    if (app.map.hasLayer(app.districtLayer)) {
        app.map.removeLayer(app.districtLayer);
        //app.districtLayer.clear();
    }
    if (app.map.hasLayer(app.busRouteLayer)) {
        app.map.removeLayer(app.busRouteLayer);
        //app.busRouteLayer.clear();
    }

  app.activeAjaxConnections++;
  cartodb.createLayer(app.map, {
    user_name: app.username,
    type: 'cartodb',
    sublayers: [{
      sql: routesMapSQL,
      // cartocss: '#layer {line-width: 1;line-color: ramp([route_id], ("#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928","#7F3C8D","#11A579","#3969AC","#F2B701","#E73F74","#80BA5A","#E68310","#008695","#CF1C90","#f97b72","#A5AA99"), category(23)); line-opacity: ;}',
      cartocss: '#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;}',
      interactivity: 'cartodb_id, route_id',
    }]
  })
  .addTo(app.map)
  .done(function(layer) {
      app.activeAjaxConnections--;
      if (app.activeAjaxConnections == 0) {
        $("body").removeClass("loading");
      }

      app.busRouteLayer = layer;
      var sublayer = layer.getSubLayer(0);
      sublayer.setInteractivity('cartodb_id, route_id');
      // tooltip definition for createLayer()
      var tooltip = layer.leafletMap.viz.addOverlay({
        type: 'tooltip',
        layer: sublayer,
        template: $('#tooltip_template').html(),
        width: 120,
        position: 'top|right',
        fields: [{ route_id: 'route_id' }]
      });
      $('#district-map').append(tooltip.render().el);

  });

  app.activeAjaxConnections++;
  cartodb.createLayer(app.map, {
    user_name: app.username,
    type: 'cartodb',
    sublayers: [{
      sql: districtMapSQL,
      cartocss: '#layer {line-width: 2;line-color: #979797;line-opacity: 1;polygon-fill: rgb(184, 233, 134);polygon-opacity: 0.4;}',
    }]
  })
  .addTo(app.map)
  .done(function(layer) {
    app.activeAjaxConnections--;

    app.districtLayer = layer;
    app.sqlclient.getBounds(routesMapSQL).done(function(bounds) {
        app.map.fitBounds(bounds);
        if (app.activeAjaxConnections == 0) {
          $("body").removeClass("loading");
        }
    });

  });

}


// static map
app.reportCardMapStatic = function (districtMapSQL, routesMapSQL) {
  // make a static map using CARTO Static API
  // first get bounds for the map
  app.bounds = [];
  app.sqlclient.getBounds(routesMapSQL)
    .done(function(bounds) {
      app.bounds = bounds;
      createStaticMap();
    });

  /**** If we want to try adding labels to text layers use somethign like the following cartocss
<<<<<<< HEAD
  * text-name:[boro_name];text-face-name:'DejaVu Sans Book';text-size:50;text-fill: #6F808D;text-halo-radius: 1;text-halo-fill: rgba(255, 255, 255, 0.75);text-transform:uppercase;
  ****/
   // "cartocss": '#layer {::shape {line-width: 1;line-color: #005777; line-opacity: 0.75;} ::label {text-name:[route_id]; text-face-name:"DejaVu Sans Book"; text-size:14; text-fill: #6F808D; text-halo-radius: 1; text-halo-fill: rgba(255, 255, 255, 0.75); text-transform:uppercase; text-placement: line; text-dy: 12; text-avoid-edges: true; text-min-distance: 100;} }',

  var mapconfig = {
    "layers": [

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
          "sql": routesMapSQL,
          "cartocss": '#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;}',
          "cartocss_version": "2.1.1"
        }
      },
      {
        "type": "mapnik",
        "options": {
          "sql": districtMapSQL,
          "cartocss": "#layer {line-width: 2;line-color: #979797;line-opacity: 1;polygon-fill: rgb(184, 233, 134);polygon-opacity: 0.4;}",
          "cartocss_version": "2.1.1"
        }
      },
    ]
  }

  var mapWidth = parseInt($('.district-map').width());
  var mapHeight = parseInt($('.district-map').height());

  var createStaticMap = function () {

      app.activeAjaxConnections++;
      $.ajax({
        crossOrigin: true,
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        url: 'https://'+app.username+'.carto.com/api/v1/map',
        data: JSON.stringify(mapconfig),
        success: function(data) {
          app.activeAjaxConnections--;
          if (app.activeAjaxConnections == 0) {
            $("body").removeClass("loading");
          }

          // url of the form /api/v1/map/static/bbox/{token}/{bbox}/{width}/{height}.{format}
          // https://carto.com/docs/carto-engine/maps-api/static-maps-api/#bounding-box
          var url = 'https://'+app.username+'.carto.com/api/v1/map/static/bbox/'+data.layergroupid+'/'+app.bounds[1][1]+','+app.bounds[1][0]+','+app.bounds[0][1]+','+app.bounds[0][0]+'/'+mapWidth+'/'+mapHeight+'.png';
          // get map image
          $('#district-map-static').html('<img class="img-responsive" src="'+url+'" />');
        }

      });

  }

}



/**** Utility functions ****/
app.numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

app.ordinal_suffix_of = function(i) {
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

// D3 color scales
app.greenColorScale = d3.scale.linear()
    .range(['#31fd5f', '#1b7640']);

app.mostBunchingColorScale = d3.scale.linear()
    .range(['#ff4442', '#b43d3e']);

app.slowestColorScale = d3.scale.linear()
    .range(['#b43d3e', '#ff4442']);


// map set up
app.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });

app.map = L.map('district-map', { scrollWheelZoom: false, center: [40.7127837, -74.0059413], zoom: 10 });

app.map.addLayer(app.tiles);

// calculating if all ajax connections are complete
app.activeAjaxConnections = 0;



// share buttons??
app.updateShareButtons = function(route_id) {
    // set up twitter and facebook URLs
    var app_id = '1581540325487727';
    var fbdescription = "Here's the report card for the " + route_id + " bus in NYC. Check out and compare your bus here!";
    var fblink = "http://busturnaround.nyc/?route=" + route_id;
    var fbpicture = "http://busturnaround.nyc/static/website/css/images/report_card_fb.png";
    var fbname = "This is the report card for the " + route_id;
    var fbcaption = "TransitCenter";
    var fbUrl = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&display=popup&description=' + encodeURIComponent(fbdescription) + '&link=' + encodeURIComponent(fblink) + '&redirect_uri=' + encodeURIComponent(fblink) + '&name=' + encodeURIComponent(fbname) + '&caption=' + encodeURIComponent(fbcaption) + '&picture=' + encodeURIComponent(fbpicture);
    var fbOnclick = 'window.open("' + fbUrl + '","facebook-share-dialog","width=626,height=436");return false;';
    //$('#showShareFB').attr("href", fbUrl);
    $('#showShareFB').attr("onclick", fbOnclick);


    var twitterlink = "http://busturnaround.nyc/?route=" + route_id;
    var via = 'TransitCenter';
    var twittercaption = "Here's the report card for the " + route_id + " bus in NYC. Check out and compare your bus here!";
    var twitterUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(twitterlink) + '&via=' + encodeURIComponent(via) + '&text=' + encodeURIComponent(twittercaption);
    var twitterOnclick = 'window.open("' + twitterUrl + '","twitter-share-dialog","width=626,height=436");return false;';
    //$('#showShareTwitter').attr("href", twitterUrl);
    $('#showShareTwitter').attr("onclick", twitterOnclick);
}
