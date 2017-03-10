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
    app.districtNumber = district.replace(/^\D+/g, '');
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
        window.history.pushState({}, '', '?district=' + $('#selectDistrict').val() + $('#number').val());
    });


    $('.toggle-district-map').on('click', function() {
        app.toggleDistrictMap = true;
        $('.district-map-holder').css('height', '300px');
        $('.toggle-district-map').css('display', 'none');

        if (!app.zoomControls) {
            new L.Control.Zoom({ position: 'topleft' }).addTo(app.map);
        }

        setTimeout(function() {
            app.map.invalidateSize();
            app.map.fitBounds(app.bounds);
        }, 300);

        // destroy tooltips
        $('.bar-chart-wrapper').tooltip('destroy');

    });
};

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
    var sql = "SELECT " + app.districtFieldName + " FROM " + app.districtTable + " ORDER BY " + app.districtFieldName;
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
        if (!app.firstRun) {
            app.districtNumber = $("#number").val();
        }

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

    // set up query to pull geometry for district
    var districtGeomSQL = 'SELECT district.the_geom FROM ' + app.districtTable + ' AS district WHERE ' + app.districtFieldName + ' = ' + app.districtNumber;

    // now select the distinct routes that intersect that geometry
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";

    // find out when all of the bar charts and text infographics have loaded so we can set the height of the map
    app.reportCardLoaded = 8;

    // update data vis text
    app.updateTextDataVis(routesWithinSQL, districtGeomSQL);

    // pass routesWithinSQL to bar chart update function
    app.updateBarCharts(routesWithinSQL);


}

// pull data and update text based on selected district
app.updateTextDataVis = function(routesWithinSQL, districtGeomSQL) {
    // set district name

    $('.districtName').text(app.printDistrict + ' ' + app.districtNumber);

    // calculate the average weekly ridership for the routes that intersect the district
    var ridershipQuery = 'SELECT sum(year_2015) FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND year_2015 IS NOT NULL';
    app.sqlclient.execute(ridershipQuery)
        .done(function(data) {

            $({ countNum: $('#totalRidership').text().replace(',', '') }).animate({ countNum: data.rows[0].sum }, {
                duration: 1000,
                easing: 'linear',
                step: function() {
                    if (this.countNum) {
                        $('#totalRidership').text(app.numberWithCommas(parseInt(this.countNum)));
                    } else {
                        $('#totalRidership').text('0');
                    }
                },
                complete: function() {
                    $('#totalRidership').text(app.numberWithCommas(parseInt(this.countNum)));
                    app.reportCardLoaded--;
                    if (app.reportCardLoaded == 0) {
                        app.calcMapHeightAndLoad();
                    }
                }
            });
        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    /**** Removing the poverty level figures for now ****/
    // // calculate bus commuters based on census block group data
    // var commuterQuery = 'SELECT sum(acs.hd01_vd11) FROM acs_14_5yr_b08301 AS acs WHERE ST_Intersects( acs.the_geom , (' + districtGeomSQL + ') )';

    // app.sqlclient.execute(commuterQuery)
    //     .done(function(data) {

    //         $({ countNum: $('#busCommuters').text().replace(',', '') }).animate({ countNum: data.rows[0].sum }, {
    //             duration: 1000,
    //             easing: 'linear',
    //             step: function() {
    //                 if (this.countNum) {
    //                     $('#busCommuters').text(app.numberWithCommas(parseInt(this.countNum)));
    //                 } else {
    //                     $('#busCommuters').text('0');
    //                 }
    //             },
    //             complete: function() {
    //                 $('#busCommuters').text(app.numberWithCommas(parseInt(this.countNum)));
    //             }
    //         });
    //     })
    //     .error(function(errors) {
    //         // errors contains a list of errors
    //         console.log("errors:" + errors);
    //     });


    // calculate number of bus routes that fall within this district
    app.sqlclient.execute(routesWithinSQL)
        .done(function(data) {

            // pull total_rows from response
            $({ countNum: $('#busRoutes').text() }).animate({ countNum: data.total_rows }, {
                duration: 1000,
                easing: 'linear',
                step: function() {
                    if (this.countNum) {
                        $('#busRoutes').text(parseInt(this.countNum));
                    } else {
                        $('#busRoutes').text('0');
                    }
                },
                complete: function() {
                    $('#busRoutes').text(parseInt(this.countNum));
                    app.reportCardLoaded--;

                    if (app.reportCardLoaded == 0) {
                        app.calcMapHeightAndLoad();
                    }
                }
            });

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    /**** Removing the poverty level figures for now ****/
    // // calculate poverty level based on census block group data
    // var poveryQuery = 'SELECT sum(acs.hd01_vd01) as total, sum(acs.hd01_vd02) as poor FROM acs_14_5yr_b17021 AS acs WHERE ST_Intersects( acs.the_geom , (' + districtGeomSQL + ') )';
    // var pctPoor;
    // app.sqlclient.execute(poveryQuery)
    //     .done(function(data) {
    //         pctPoor = parseInt(((data.rows[0].poor / data.rows[0].total) * 100).toFixed())

    //         $({ countNum: $('#percentPoverty').text() }).animate({ countNum: pctPoor }, {
    //             duration: 1000,
    //             easing: 'linear',
    //             step: function() {
    //                 if (this.countNum) {
    //                     $('#percentPoverty').text(parseInt(this.countNum));
    //                 } else {
    //                     $('#percentPoverty').text('0');
    //                 }
    //             },
    //             complete: function() {
    //                 $('#percentPoverty').text(parseInt(this.countNum));
    //             }
    //         });
    //     })
    //     .error(function(errors) {
    //         // errors contains a list of errors
    //         console.log("errors:" + errors);
    //     });


    // calculate the average speed for routes intersecting the district weighted by ridership
    var avgSpeedWeightedQuery = 'SELECT sum(speedtable.speed * ridershiptable.year_2015) / sum(ridershiptable.year_2015) AS wavg FROM speed_by_route_10_2015_05_2016 AS speedtable, mta_nyct_bus_avg_weekday_ridership AS ridershiptable WHERE speedtable.route_id = ridershiptable.route_id AND ridershiptable.route_id IN (' + routesWithinSQL + ') AND ridershiptable.year_2015 IS NOT NULL';
    app.sqlclient.execute(avgSpeedWeightedQuery)
        .done(function(data) {
            $({ countNum: $('#avgSpeedWeighted').text() }).animate({ countNum: data.rows[0].wavg.toFixed(1) }, {
                duration: 1000,
                easing: 'linear',
                step: function() {
                    if (this.countNum) {
                        $('#avgSpeedWeighted').text(parseFloat(this.countNum).toFixed(1));
                    } else {
                        $('#avgSpeedWeighted').text('0');
                    }
                },
                complete: function() {
                    $('#avgSpeedWeighted').text(parseFloat(this.countNum).toFixed(1));
                    app.reportCardLoaded--;
                    if (app.reportCardLoaded == 0) {
                        app.calcMapHeightAndLoad();
                    }
                }
            });
        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

    // calculate the average speed for routes intersecting the district weighted by ridership
    var avgBunchingWeightedQuery = 'SELECT sum(bunchingtable.prop_bunched * ridershiptable.year_2015) / sum(ridershiptable.year_2015) AS wavg FROM bunching_10_2015_05_2016 AS bunchingtable, mta_nyct_bus_avg_weekday_ridership AS ridershiptable WHERE bunchingtable.route_id = ridershiptable.route_id AND ridershiptable.route_id IN (' + routesWithinSQL + ') AND ridershiptable.year_2015 IS NOT NULL';
    app.sqlclient.execute(avgBunchingWeightedQuery)
        .done(function(data) {
            $({ countNum: $('#avgBunchingWeighted').text() }).animate({ countNum: (data.rows[0].wavg * 100).toFixed(1) }, {
                duration: 1000,
                easing: 'linear',
                step: function() {
                    if (this.countNum) {
                        $('#avgBunchingWeighted').text(parseFloat(this.countNum).toFixed(1));
                    } else {
                        $('#avgBunchingWeighted').text('0');
                    }
                },
                complete: function() {
                    $('#avgBunchingWeighted').text(parseFloat(this.countNum).toFixed(1));
                    app.reportCardLoaded--;
                    if (app.reportCardLoaded == 0) {
                        app.calcMapHeightAndLoad();
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
    var ridershipQuery = 'SELECT route_id, year_2015, note FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND year_2015 IS NOT NULL ORDER BY year_2015 DESC LIMIT 3 ';

    app.sqlclient.execute(ridershipQuery)
        .done(function(data) {
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

            // check for existance of SVG and update chart if it already esists
            if ($('#ridership').html()) {
                app.updateBarChart('#ridership', app.greenColorScale, ridershipArray);
            } else {
                app.createBarChart('#ridership', app.greenColorScale, ridershipArray);
            }

            app.createNotesForRidershipBarChart(ridershipNotesArray);

            app.reportCardLoaded--;
            if (app.reportCardLoaded == 0) {
                app.calcMapHeightAndLoad();
            }

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // using the routes selected by district, build a query for top three routes by fastest growing
    var fastestGrowingQuery = 'SELECT route_id, prop_change_2010_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND prop_change_2010_2015 >= 0 AND prop_change_2010_2015 IS NOT NULL ORDER BY prop_change_2010_2015 DESC LIMIT 3 ';


    app.sqlclient.execute(fastestGrowingQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var fastestGrowingArray = [];
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                pct = parseFloat((data.rows[i].prop_change_2010_2015 * 100).toFixed());
                fastestGrowingArray.push({ label: data.rows[i].route_id, value: pct });
            }

            // check for existance of SVG and update chart if it already esists
            if ($('#fastestGrowing').html()) {
                app.updateBarChart('#fastestGrowing', app.greenColorScale, fastestGrowingArray);
            } else {
                app.createBarChart('#fastestGrowing', app.greenColorScale, fastestGrowingArray);
            }

            app.reportCardLoaded--;
            if (app.reportCardLoaded == 0) {
                app.calcMapHeightAndLoad();
            }

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

    // using the routes selected by district, build a query for top three routes by most bunching
    var mostBunchingQuery = 'SELECT route_id, prop_bunched FROM bunching_10_2015_05_2016 WHERE route_id IN (' + routesWithinSQL + ') AND prop_bunched IS NOT NULL ORDER BY prop_bunched DESC LIMIT 3';

    app.sqlclient.execute(mostBunchingQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var mostBunchingArray = [];
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                pct = parseFloat((data.rows[i].prop_bunched * 100).toFixed(1));
                mostBunchingArray.push({ label: data.rows[i].route_id, value: pct });
            }

            // check for existance of SVG and update chart if it already esists
            if ($('#mostBunching').html()) {
                app.updateBarChart('#mostBunching', app.mostBunchingColorScale, mostBunchingArray);
            } else {
                app.createBarChart('#mostBunching', app.mostBunchingColorScale, mostBunchingArray);
            }

            app.reportCardLoaded--;
            if (app.reportCardLoaded == 0) {
                app.calcMapHeightAndLoad();
            }

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });


    // using the routes selected by district, build a query for top three slowest routes
    var slowestQuery = 'SELECT route_id, speed FROM speed_by_route_10_2015_05_2016 WHERE route_id IN (' + routesWithinSQL + ') AND speed IS NOT NULL ORDER BY speed ASC LIMIT 3';

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

            // check for existance of SVG and update chart if it already esists
            if ($('#slowest').html()) {
                app.updateBarChart('#slowest', app.slowestColorScale, slowestArray);
            } else {
                app.createBarChart('#slowest', app.slowestColorScale, slowestArray);
            }

            app.reportCardLoaded--;
            if (app.reportCardLoaded == 0) {
                app.calcMapHeightAndLoad();
            }


        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

}

app.createBarChart = function(divId, barChartColorScale, data) {

    var width = $('.bar-chart-wrapper').width(),
        barHeight = 25;

    var chart = d3.select(divId)
        .append('svg')
        .attr("width", width)
        .attr("height", barHeight * data.length);

    app.updateBarChart(divId, barChartColorScale, data);

};

app.updateBarChart = function(divId, barChartColorScale, data) {
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

    var width = $('.bar-chart-wrapper').width(),
        barHeight = 25,
        barWidth = width * (3 / 4);

    var x = d3.scaleLinear()
        .domain([0, d3.max(arr)])
        .range([barWidth / 4, barWidth]);

    var chart = d3.select(divId)
        .select('svg')
        .attr("width", width)
        .attr("height", barHeight * data.length);

    // update
    var barChartGs = chart.selectAll("g")
        .data(data)
        .on('click', function(d) {
            if (app.toggleDistrictMap) {
                app.highlightRoute(d.label);
            }
        });

    barChartGs.select('rect')
        .attr('fill', function(d) {
            return barChartColorScale(d.value);
        })
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("width", function(d, i) {
            return x(d.value) - 3;
        });

    barChartGs.select('.inside-bar-text')
        .text(function(d) {
            if (divId === '#fastestGrowing' || divId === '#mostBunching') {
                return d.value + '%';
            } else if (divId === '#slowest') {
                return d.value + ' mph';
            }
            return app.numberWithCommas(d.value);
        })
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return x(d.value) - 10;
        })

    barChartGs.select('.outside-bar-text')
        .text(function(d) {
            return d.label;
        })
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return x(d.value) + 3;
        })

    // enter
    var enterBars = barChartGs.enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * barHeight + ")";
        })
        .attr("class", "clickable-g-container")   
        .on('click', function(d) {
            if (app.toggleDistrictMap) {
                app.highlightRoute(d.label);
            }
        });

    enterBars.append("rect")
        .attr('fill', function(d) {
            return barChartColorScale(d.value);
        })
        .attr("height", barHeight - 5)
        .attr("width", 0)
        .merge(barChartGs)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("width", function(d, i) {
            return x(d.value) - 3;
        });

    enterBars.append("text")
        .attr("class", "inside-bar-text")
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            if (divId === '#fastestGrowing' || divId === '#mostBunching') {
                return d.value + '%';
            } else if (divId === '#slowest') {
                return d.value + ' mph';
            }
            return app.numberWithCommas(d.value);
        })
        .attr("x", 10)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return x(d.value) - 10;
        });

    enterBars.append("text")
        .attr("class", "outside-bar-text")
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.label;
        })
        .attr("x", 23)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return x(d.value) + 3;
        });

    // exit
    barChartGs.exit()
        .transition()
        .duration(500)
        .style('opacity', '0')
        .remove();

};

app.createNotesForRidershipBarChart = function(ridershipNotesArray) {
    // clear previous notes
    $('#ridershipNotes').html('');
    for (var i = ridershipNotesArray.length - 1; i >= 0; i--) {
        $('#ridershipNotes').append("<p><sup>*</sup>" + ridershipNotesArray[i] + "</p>");
    }
}

// run when we're ready to set up map
app.calcMapHeightAndLoad = function() {
    // get height of report card container and set height of map based on other containers
    var height = $('.report-card').height() - $('.ways-to-address').height() - 20;
    // $('.district-map').height(height);

    // run set up functions
    if (typeof app.map === "undefined") {
        app.mapSetup();
    }

    // get district number
    var districtNumber = $("#number").val();

    // set up query to pull geometry for district

    var districtGeomSQL = 'SELECT district.the_geom FROM ' + app.districtTable + ' AS district WHERE ' + app.districtFieldName + ' = ' + districtNumber;

    // now select the distinct routes that intersect that geometry
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";

    var districtMapSQL = 'SELECT * FROM ' + app.districtTable + ' AS district WHERE ' + app.districtFieldName + ' = ' + districtNumber;

    var allDistictMapSQL = 'SELECT * FROM ' + app.districtTable + ' AS district';

    var routesMapSQL = 'SELECT * FROM mta_nyct_bus_routes WHERE route_id IN (' + routesWithinSQL + ')';

    var routesWithDataSQL = "SELECT mta.cartodb_id, mta.route_id, mta.the_geom_webmercator, TO_CHAR(CAST(ridership.year_2015 AS numeric), '999G999') AS year_2015, ROUND(CAST(ridership.prop_change_2010_2015 AS numeric) * 100, 1) AS prop_change_2010_2015, ROUND(CAST(speed.speed AS numeric), 1) AS speed, ROUND(CAST(bunching.prop_bunched AS numeric) * 100, 1) AS prop_bunched FROM mta_nyct_bus_routes AS mta LEFT OUTER JOIN mta_nyct_bus_avg_weekday_ridership AS ridership ON (mta.route_id = ridership.route_id) LEFT OUTER JOIN speed_by_route_10_2015_05_2016 AS speed ON (mta.route_id = speed.route_id) LEFT OUTER JOIN bunching_10_2015_05_2016 AS bunching ON (mta.route_id = bunching.route_id) WHERE mta.route_id IN (" + routesWithinSQL + ")";

    // update the map
    // interactive
    app.reportCardMap(districtMapSQL, routesWithDataSQL, routesMapSQL, allDistictMapSQL);

    /**** Removing the static print map for now ****/
    //static map
    app.reportCardMapStatic(districtMapSQL, routesMapSQL);

}


// map set up
app.mapSetup = function() {
    app.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' });

    app.map = L.map('district-map', { scrollWheelZoom: false, center: [40.74, -73.89], zoom: 11, closePopupOnClick: true, zoomControl: false });

    if ($('.district-map-holder').css('position') == 'fixed') {
        app.toggleDistrictMap = true;
        app.zoomControls = new L.Control.Zoom({ position: 'topleft' }).addTo(app.map);
        // destroy tooltips
        $('.bar-chart-wrapper').tooltip('destroy');
    } else {
        app.toggleDistrictMap = false;
    }

    app.map.addLayer(app.tiles);
}

// interactive map
app.reportCardMap = function(districtMapSQL, routesWithDataSQL, routesMapSQL, allDistictMapSQL) {

    if (app.map.hasLayer(app.allDistrictLayer)) {
        app.map.removeLayer(app.allDistrictLayer);
    }
    if (app.map.hasLayer(app.districtLayer)) {
        app.map.removeLayer(app.districtLayer);
    }
    if (app.map.hasLayer(app.routeLayer)) {
        app.map.removeLayer(app.routeLayer);
    }

    app.polygons = {};

    function geometryHover(layer, options) {

        options = options || {}
        var HIGHLIGHT_STYLE = {
            weight: 2,
            color: '#979797',
            opacity: 1,
            fillColor: 'rgb(184, 233, 134)',
            fillOpacity: 0.4
        };
        // {line-width: 2;line-color: #979797;line-opacity: 1;polygon-fill: rgb(184, 233, 134);polygon-opacity: 0.4;}
        style = options.style || HIGHLIGHT_STYLE;
        var polygonsHighlighted = [];


        // fetch the geometry
        var sql = new cartodb.SQL({ user: app.username, format: 'geojson' });
        sql.execute("select cartodb_id, " + app.districtFieldName + " as districtNum, the_geom as the_geom from (" + layer.getSQL() + ") as _wrap").done(function(geojson) {
            console.log(geojson, 'geojson');
            var features = geojson.features;
            for (var i = 0; i < features.length; ++i) {
                var f = geojson.features[i];
                var key = f.properties.cartodb_id

                // generate geometry
                //var geometry = L.GeoJSON.geometryToLayer(features[i].geometry);
                var geo = L.geoJson(features[i], {
                    onEachFeature: function(feature, layer) {
                        layer.on('click', function() {
                            app.selectDistrictNumberMenu.val(feature.properties.districtnum).trigger("change");
                        });
                    }
                });

                geo.setStyle(style);
                //console.log(geo, "geometries");
                // add to polygons
                app.polygons[key] = app.polygons[key] || [];
                app.polygons[key].push(geo);
            }
        });

        function featureOver(e, pos, latlng, data) {
            featureOut();
            var pol = app.polygons[data.cartodb_id] || [];
            for (var i = 0; i < pol.length; ++i) {
                app.map.addLayer(pol[i]);
                polygonsHighlighted.push(pol[i]);
            }
        }

        function featureOut() {
            var pol = polygonsHighlighted;
            for (var i = 0; i < pol.length; ++i) {
                app.map.removeLayer(pol[i]);
            }
            polygonsHighlighted = [];
        }

        layer.on('featureOver', featureOver);
        layer.on('featureOut', featureOut);
        layer.setInteraction(true);

    }

    var districtFieldName = 'cartodb_id, ' + app.districtFieldName;

    cartodb.createLayer(app.map, {
            user_name: app.username,
            type: 'cartodb',
            sublayers: [{
                sql: allDistictMapSQL,
                cartocss: '#layer {line-width: 1;line-color: #FF6600;line-opacity: 1;polygon-opacity: 0;}',
                interactivity: districtFieldName,
            }]
        })
        .addTo(app.map)
        .done(function(layer) {
            app.allDistrictLayer = layer;
            layer.setInteraction(true);
            app.districtSublayer = layer.getSubLayer(0);
            //app.districtSublayer.setInteraction(true);
            //app.districtSublayer.setInteractivity(districtFieldName);
            geometryHover(app.districtSublayer);

            // app.sqlclient.getBounds(routesMapSQL).done(function(bounds) {
            //     app.bounds = bounds;
            //     //app.map.fitBounds(app.bounds);
            //     if (app.activeAjaxConnections == 0) {
            //         $("body").removeClass("loading");
            //     }
            // });

        });



    app.activeAjaxConnections++;
    cartodb.createLayer(app.map, {
            user_name: app.username,
            type: 'cartodb',
            sublayers: [{
                sql: routesWithDataSQL,
                cartocss: '#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;}',
                interactivity: 'cartodb_id, route_id, year_2015, prop_change_2010_2015, speed, prop_bunched',
            }]
        })
        .addTo(app.map)
        .done(function(layer) {
            app.routeLayer = layer;
            app.routeLayer.setInteraction(true);

            app.routesSublayer = app.routeLayer.getSubLayer(0);
            app.routesSublayer.setInteraction(true);
            app.routesSublayer.setInteractivity('cartodb_id, route_id, year_2015, prop_change_2010_2015, speed, prop_bunched');

            cdb.vis.Vis.addInfowindow(app.map, app.routesSublayer, ['route_id', 'year_2015', 'prop_change_2010_2015', 'speed', 'prop_bunched'], { infowindowTemplate: $('#infowindow_template').html() });

            app.routesSublayer.on('featureClick', function(e, pos, latlng, data) {
                app.routeLayer.setCartoCSS('#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;} #layer[route_id = "' + data.route_id + '"]::z1 {line-width: 4;line-color: #1b7640; line-opacity: 1;}');
            });

            app.activeAjaxConnections--;
            if (app.activeAjaxConnections == 0) {
                $("body").removeClass("loading");
            }

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
            app.sqlclient.getBounds(districtMapSQL).done(function(bounds) {
                app.bounds = bounds;
                if (app.toggleDistrictMap) {
                    app.map.fitBounds(app.bounds);
                }

                if (app.activeAjaxConnections == 0) {
                    $("body").removeClass("loading");
                }
            });

        });
}

app.highlightRoute = function(routeId) {
    // strip out a trailing * if one exists
    routeId = routeId.replace('*', '');

    app.routeLayer.setCartoCSS('#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;} #layer[route_id = "' + routeId + '"]::z1 {line-width: 3;line-color: #F78C6C; line-opacity: 1;}');
    // open infowindow
    // Select one of the geometries from the table
    var sql = "SELECT mta.cartodb_id, mta.route_id, ST_X(ST_Line_Interpolate_Point(ST_LineMerge(mta.the_geom), 0.5)), ST_Y(ST_Line_Interpolate_Point(ST_LineMerge(mta.the_geom), 0.5)), TO_CHAR(CAST(ridership.year_2015 AS numeric), '999G999') AS year_2015, ROUND(CAST(ridership.prop_change_2010_2015 AS numeric) * 100, 1) AS prop_change_2010_2015, ROUND(CAST(speed.speed AS numeric), 1) AS speed, ROUND(CAST(bunching.prop_bunched AS numeric) * 100, 1) AS prop_bunched FROM mta_nyct_bus_routes AS mta LEFT OUTER JOIN mta_nyct_bus_avg_weekday_ridership AS ridership ON (mta.route_id = ridership.route_id) LEFT OUTER JOIN speed_by_route_10_2015_05_2016 AS speed ON (mta.route_id = speed.route_id) LEFT OUTER JOIN bunching_10_2015_05_2016 AS bunching ON (mta.route_id = bunching.route_id) WHERE mta.route_id = '" + routeId + "' LIMIT 1";
    app.sqlclient.execute(sql)
        .done(function(data) {
            // center map on returned lat/lng
            var latLng = new L.LatLng(data.rows[0]['st_y'], data.rows[0]['st_x']);
            app.map.panTo(latLng);

            // now fire a click where the returned point is located
            app.routesSublayer.trigger('featureClick', null, [data.rows[0]['st_y'], data.rows[0]['st_x']], null, { route_id: data.rows[0]['route_id'], speed: data.rows[0]['speed'], prop_bunched: data.rows[0]['prop_bunched'], year_2015: data.rows[0]['year_2015'], prop_change_2010_2015: data.rows[0]['prop_change_2010_2015'] }, 0);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

};

app.resetRouteStyle = function() {
    app.routeLayer.setCartoCSS('#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;}');
};


// static map
app.reportCardMapStatic = function(districtMapSQL, routesMapSQL) {
    // make a static map using CARTO Static API
    // first get bounds for the map
    app.bounds = [];
    app.sqlclient.getBounds(districtMapSQL)
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
            }, {
                "type": "mapnik",
                "options": {
                    "sql": routesMapSQL,
                    "cartocss": '#layer {line-width: 1;line-color: #005777; line-opacity: 0.75;}',
                    "cartocss_version": "2.1.1"
                }
            }, {
                "type": "mapnik",
                "options": {
                    "sql": districtMapSQL,
                    "cartocss": "#layer {line-width: 2;line-color: #979797;line-opacity: 1;polygon-fill: rgb(184, 233, 134);polygon-opacity: 0.4;}",
                    "cartocss_version": "2.1.1"
                }
            },
        ]
    }

    var mapWidth = 400;
    var mapHeight = 300;

    var createStaticMap = function() {

        $.ajax({
            crossOrigin: true,
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            url: 'https://' + app.username + '.carto.com/api/v1/map',
            data: JSON.stringify(mapconfig),
            success: function(data) {
                // url of the form /api/v1/map/static/bbox/{token}/{bbox}/{width}/{height}.{format}
                // https://carto.com/docs/carto-engine/maps-api/static-maps-api/#bounding-box
                var url = 'https://' + app.username + '.carto.com/api/v1/map/static/bbox/' + data.layergroupid + '/' + app.bounds[1][1] + ',' + app.bounds[1][0] + ',' + app.bounds[0][1] + ',' + app.bounds[0][0] + '/' + mapWidth + '/' + mapHeight + '.png';
                // get map image
                $('#district-map-static').html('<img src="' + url + '" />');
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
app.greenColorScale = d3.scaleLinear()
    .range(['#31fd5f', '#1b7640']);

app.mostBunchingColorScale = d3.scaleLinear()
    .range(['#ff4442', '#b43d3e']);

app.slowestColorScale = d3.scaleLinear()
    .range(['#b43d3e', '#ff4442']);



// calculating if all ajax connections are complete
app.activeAjaxConnections = 0;
