/*!
 * district_app.js: Javascript that controls the Transitcenter Distrct Level Analysis Page
 */

function app() {}

var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];

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

    app.createBarChart('#ridership', app.greenColorScale, data);
    app.createBarChart('#fastestGrowing', app.greenColorScale, data);
    app.createBarChart('#mostBunching', app.mostBunchingColorScale, data);
    app.createBarChart('#slowest', app.slowestColorScale, data);

    // set up report card drop down menu
    var district = "State Assembly District 32";
   	app.createStateSenateOptions(district);
};

app.createBarChart = function(divId, barChartColorScale, data) {
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
            return x(d.value) - 10;
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            if (divId === '#fastestGrowing' || divId === '#mostBunching') {
                return d.value + ' %';
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
        // add functions to call with update
    });
}


app.createStateSenateOptions = function(district) {

    // first pull state assembly districts and append
    app.sqlclient.execute("SELECT stsendist FROM nyc_state_senate_districts ORDER BY stsendist")
        .done(function(data) {

            // loop through response to populate dropdown
            for (var i = 0; i < data.rows.length; i++) {
                var option = $('<option/>').attr({ 'value': 'State Senate District ' + data.rows[i].stsendist }).text('State Senate District ' + data.rows[i].stsendist);
                $('#dropdownStateSenate').append(option);
            }

        	// now populate state assembly district options
        	app.createStateAssemblyOptions(district);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
}

app.createStateAssemblyOptions = function(district) {

    // first pull state assembly districts and append
    app.sqlclient.execute("SELECT assem_dist FROM nyc_state_assembly_districts ORDER BY assem_dist")
        .done(function(data) {

            // loop through response to populate dropdown
            for (var i = 0; i < data.rows.length; i++) {
                var option = $('<option/>').attr({ 'value': 'State Assembly District ' + data.rows[i].assem_dist }).text('State Assembly District ' + data.rows[i].assem_dist);
                $('#dropdownStateAssembly').append(option);
            }

            // now inititize the select 2 menu
            app.initSelect2Menu(district);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
}

app.initSelect2Menu = function(district) {
	// when done create select2 menu
	// if mobile, skip setting up select 2
	if (($('body')).width() < 767) {
	    $("#selectDistrict").val();
	} else {
	    app.selectDistrictMenu = $("#selectDistrict").select2();

	    app.selectDistrictMenu.on("select2:open", function(e) {
	        // add type bx placeholder text
	        $(".select2-search__field").attr("placeholder", "Start typing a district here to search.");
	    });

	    app.selectDistrictMenu.val(district).trigger("change");

	}
}



/**** Utility functions ****/
app.numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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
