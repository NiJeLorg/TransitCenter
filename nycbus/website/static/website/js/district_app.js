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

    // set up listeners
    app.createListeners();

    // set up report card drop down menu
   	app.createStateSenateOptions();

   	// set up SQL queries to select the routes based on district
   	app.selectRoutes(district);

};

// sets up listeners
app.createListeners = function() {

    if (($('body')).width() >= 767) {
        $('a.page-scroll').bind('click', function(event) {
            event.preventDefault();
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 2000, 'easeInOutQuint');
        });
    }

    // listen for on change to update visualizations
    $('#selectDistrict').change(function() {
      // update route selection and data
      app.selectRoutes($(this).val());
    });
}

/**** Create select2 drop down menu ****/
app.createStateSenateOptions = function() {

    // first pull state assembly districts and append
    app.sqlclient.execute("SELECT stsendist FROM nyc_state_senate_districts ORDER BY stsendist")
        .done(function(data) {

            // loop through response to populate dropdown
            for (var i = 0; i < data.rows.length; i++) {
                var option = $('<option/>').attr({ 'value': 'State Senate District ' + data.rows[i].stsendist }).text('State Senate District ' + data.rows[i].stsendist);
                $('#dropdownStateSenate').append(option);
            }

        	// now populate state assembly district options
        	app.createStateAssemblyOptions();

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
}

app.createStateAssemblyOptions = function() {

    // first pull state assembly districts and append
    app.sqlclient.execute("SELECT assem_dist FROM nyc_state_assembly_districts ORDER BY assem_dist")
        .done(function(data) {

            // loop through response to populate dropdown
            for (var i = 0; i < data.rows.length; i++) {
                var option = $('<option/>').attr({ 'value': 'State Assembly District ' + data.rows[i].assem_dist }).text('State Assembly District ' + data.rows[i].assem_dist);
                $('#dropdownStateAssembly').append(option);
            }

            // now inititize the select 2 menu
            app.initSelect2Menu();

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
}

app.initSelect2Menu = function() {
	// when done create select2 menu
	// if mobile, skip setting up select 2
	if (($('body')).width() < 767) {
	    $("#selectDistrict").val(district);
	} else {
	    app.selectDistrictMenu = $("#selectDistrict").select2();

	    app.selectDistrictMenu.on("select2:open", function(e) {
	        // add type bx placeholder text
	        $(".select2-search__field").attr("placeholder", "Start typing a district here to search.");
	    });

	    app.selectDistrictMenu.val(district).trigger("change");

	}
}
/********/

// SQL set up to select routes from selected district
app.selectRoutes = function(district) {
	// check to see if state senate or state assembly district was chosen
	var districtTable;
	var districtFieldName;
	if (district.search('Senate') != -1) {
		districtTable = 'nyc_state_senate_districts';
		districtFieldName = 'stsendist';
	} else {
		districtTable = 'nyc_state_assembly_districts';
		districtFieldName = 'assem_dist';
	}

	// get district number with regex
	var districtNumber = district.replace( /^\D+/g, '');

	// set up query to pull geometry for district
    var districtGeomSQL = 'SELECT district.the_geom FROM '+ districtTable +' AS district WHERE '+ districtFieldName +' = ' + districtNumber;	

	// now select the distinct routes that intersect that geometry
    var routesWithinSQL = 'SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE ST_Intersects( mta.the_geom , ('+ districtGeomSQL +') )';

    // pass routesWithinSQL to bar chart update function
    app.updateBarCharts(routesWithinSQL);

    // update data vis text
    app.updateTextDataVis(district, routesWithinSQL);

}

// pull data and update text based on selected district
app.updateTextDataVis = function(district, routesWithinSQL) {
	// set district name
	$('#districtName').text(district);  

	// // calculate bus commuters based on average weekday riderhip by route
	// var commuterQuery = 'SELECT year_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN ('+ routesWithinSQL +') AND year_2015 IS NOT NULL';

 //    app.sqlclient.execute(commuterQuery)
 //        .done(function(data) {
 //        	// sum up the average weekday ridership
 //        	var sum;
 //        	for (var i = 0; i < data.rows.length; i++) {
 //        		
 //        	}
 //        })
 //        .error(function(errors) {
 //            // errors contains a list of errors
 //            console.log("errors:" + errors);
 //        });	


 	// calculate number of bus routes that fall within this district
    app.sqlclient.execute(routesWithinSQL)
        .done(function(data) {
        	// pull total_rows from response
        	console.log(data.total_rows);
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
	var ridershipQuery = 'SELECT route_id, year_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN ('+ routesWithinSQL +') AND year_2015 IS NOT NULL ORDER BY year_2015 DESC LIMIT 3 ';

    app.sqlclient.execute(ridershipQuery)
        .done(function(data) {
        	// create data object and pass to bar chart for the form
        	//var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
        	var ridershipArray = [];
        	for (var i = 0; i < data.rows.length; i++) {
        		ridershipArray.push({ label: data.rows[i].route_id, value: data.rows[i].year_2015 });
        	}

    		app.createBarChart('#ridership', app.greenColorScale, ridershipArray);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });	


    // using the routes selected by district, build a query for top three routes by fastest growing
	var fastestGrowingQuery = 'SELECT route_id, prop_change_2010_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN ('+ routesWithinSQL +') AND prop_change_2010_2015 IS NOT NULL ORDER BY prop_change_2010_2015 DESC LIMIT 3 ';

    app.sqlclient.execute(fastestGrowingQuery)
        .done(function(data) {
        	console.log(data);
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

    app.sqlclient.execute(mostBunchingQuery)
        .done(function(data) {
        	console.log(data);
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

    app.sqlclient.execute(slowestQuery)
        .done(function(data) {
        	console.log(data);
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
        .range([0, barWidth]);

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
            return x(d.value) - 80;
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
