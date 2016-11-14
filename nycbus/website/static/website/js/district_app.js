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
    //app.createReportCardDropdowns(______);
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



// TO DO: Update this function to call state assembly and state senate districts
app.createReportCardDropdowns = function(route_id) {

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
                var ax = [],
                    bx = [];
                a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
                b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
                while (ax.length && bx.length) {
                    var an = ax.shift();
                    var bn = bx.shift();
                    var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
                    if (nn) return nn;
                }
                return ax.length - bx.length;
            }

            // loop through response to populate dropdown
            for (var i = 0; i < routeIDs.length; i++) {
                var option = $('<option/>').attr({ 'value': routeIDs[i] }).text(routeIDs[i].replace('+', ' SBS'));
                // ensure M60 and M86 are tagged as SBS
                if (routeIDs[i] == 'M60' || routeIDs[i] == 'M86') {
                    option = $('<option/>').attr({ 'value': routeIDs[i] + '+' }).text(routeIDs[i] + ' SBS');
                }
                if (routeIDs[i].charAt(0) === 'B' && routeIDs[i].charAt(1) === 'X' && routeIDs[i].charAt(2) === 'M') {
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
                    // skip S81, S86, S91, S92, S94, S96, S98
                    if (routeIDs[i] == 'S81' || routeIDs[i] == 'S86' || routeIDs[i] == 'S91' || routeIDs[i] == 'S92' || routeIDs[i] == 'S94' || routeIDs[i] == 'S96' || routeIDs[i] == 'S98') {
                        //skip
                    } else {
                        $('#dropdownS').append(option);
                    }
                } else {
                    $('#dropdownX').append(option);
                }

            }

            // when done create select2 menu
            // if mobile, skip setting up select 2
            if (($('body')).width() < 767) {
                $("#selectDistrict").val(route_id);
            } else {
                app.selectDistrictMenu = $("#selectDistrict").select2();

                app.selectDistrictMenu.on("select2:open", function(e) {
                    // add type bx placeholder text
                    $(".select2-search__field").attr("placeholder", "Start typing a bus route here to search.");
                });

                // set first route
                app.selectDistrictMenu.val(route_id).trigger("change");

            }


        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        })
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
