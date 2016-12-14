/*!
 * district_detail_app.js: Javascript that controls the Transitcenter Distrct Level Detail Page
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
        // create url parameters
        window.history.pushState({}, '', '?district=' + $(this).val());
    });
};

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
    var districtNumber = district.replace(/^\D+/g, '');

    // set up query to pull geometry for district
    var districtGeomSQL = 'SELECT district.the_geom FROM ' + districtTable + ' AS district WHERE ' + districtFieldName + ' = ' + districtNumber;

    // now select the distinct routes that intersect that geometry
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";

    // pass routesWithinSQL to bar chart update function
    app.updateBarCharts(routesWithinSQL);

}


// pull data and creates bar charts for selected district
app.updateBarCharts = function(routesWithinSQL) {

    // using the routes selected by district, build a query for top three routes in ridership
    var ridershipQuery = 'SELECT route_id, year_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND year_2015 IS NOT NULL ORDER BY year_2015 DESC';

    app.sqlclient.execute(ridershipQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var ridershipArray = [];
            for (var i = 0; i < data.rows.length; i++) {
                ridershipArray.push({ label: data.rows[i].route_id, value: data.rows[i].year_2015 });
            }

            app.createBarChart('#ridership', ridershipArray);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // using the routes selected by district, build a query for top three routes by fastest growing
    var fastestGrowingQuery = 'SELECT route_id, prop_change_2010_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND prop_change_2010_2015 IS NOT NULL ORDER BY prop_change_2010_2015 DESC';

    app.sqlclient.execute(fastestGrowingQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var ridershipChange = [];
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                pct = parseFloat((data.rows[i].prop_change_2010_2015 * 100).toFixed());
                ridershipChange.push({ label: data.rows[i].route_id, value: pct });
            }

            app.createBarChart('#ridershipChange', ridershipChange);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

    // using the routes selected by district, build a query for top three routes by most bunching
    var mostBunchingQuery = 'SELECT route_id, prop_bunched FROM bunching_10_2015_05_2016 WHERE route_id IN (' + routesWithinSQL + ') AND prop_bunched IS NOT NULL ORDER BY prop_bunched DESC';

    app.sqlclient.execute(mostBunchingQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var bunching = [];
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                pct = parseFloat((data.rows[i].prop_bunched * 100).toFixed(1));
                bunching.push({ label: data.rows[i].route_id, value: pct });
            }

            app.createBarChart('#bunching', bunching);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // using the routes selected by district, build a query for top three slowest routes
    var slowestQuery = 'SELECT route_id, speed FROM speed_by_route_10_2015_05_2016 WHERE route_id IN (' + routesWithinSQL + ') AND speed IS NOT NULL ORDER BY speed ASC';

    app.sqlclient.execute(slowestQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var slowestArray = [];
            var num;
            for (var i = 0; i < data.rows.length; i++) {
                num = parseFloat(data.rows[i].speed.toFixed(1));
                slowestArray.push({ label: data.rows[i].route_id, value: num });
            }

            app.createBarChart('#speed', slowestArray);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });
};

app.createBarChart = function(divId, data) {
    // for now, destroy previous bar charts
    $(divId).html('');
    var arr = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (typeof data[i][key] === 'number') {
                arr.push(data[i][key]);
            }
        }
    }
    var x;
    var margin = { top: 50, right: 20, bottom: 50, left: 80 };
    var width = $('.metric-component .chart-component').width() - margin.right - margin.left,
        barHeight = 25,
        barWidth = width * (3 / 4);
    var height = (barHeight * data.length) - (margin.top - margin.bottom);
    var totalHeight = height + margin.top;

    var chart = d3.select(divId)
        .append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    chart.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    if (divId === '#ridershipChange') {
        x = d3.scale.linear()
            .domain(d3.extent(data, function(d) {
                return d.value;
            }))
            .range([0, width]);
    } else {
        x = d3.scale.linear()
            .domain([0, d3.max(arr)])
            .range([0, width]);
    }
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var bar = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(" + margin.left + "," + i * barHeight + ")";
        });

    bar.append("rect")
        .attr('fill', '#15B6E5')
        .attr("width", function(d, i) {
            return x(d.value) - 3;
        })
        .attr("height", barHeight - 5);

    bar.append("text")
        .attr("class", "inside-bar-text")
        .attr("x", function(d) {
            return x(d.value) - 60;
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            if (divId === '#bunching') {
                return d.value + '%';
            } else if (divId === '#speed') {
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
    chart.append('g')
        .attr('class', 'x-axis')
        .call(xAxis)
        .attr("transform", function(d, i) {
            return "translate(" + margin.left + "," + totalHeight + ")";
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

$('.table-chart-holder table tr td:nth-child(3)').each(function(i, el) {
    var textValue = $(el).text();
    textValue = parseFloat(textValue, 10)
    if (textValue > 0) {
        $(el).css('color', 'green');
    } else {
        $(el).css('color', 'red');
    }
})
