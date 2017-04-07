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

    // create speed gauge
    app.initSpeedGauge();

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

    $('.toggle-city').click(function() {
        app.map.setView(new L.LatLng(40.7, -74.0), 10);
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

app.initSpeedGauge = function() {
    // update speed gauge
    // set up report card speed gauge
    app.speedGaugeObject = app.speedGauge('#speed-gauge', {
        size: 200,
        clipWidth: 200,
        clipHeight: 120,
        ringWidth: 60,
        minValue: 0,
        maxValue: 19,
        transitionMs: 2000,
        majorTicks: 15,
        pointerWidth: 5,
        pointerTailLength: 3,
        pointerHeadLengthPercent: 0.95,
    });
    app.speedGaugeObject.render();
}


// SQL set up to select routes from selected district
app.selectRoutes = function() {

    // set up query to pull geometry for district
    var districtGeomSQL = 'SELECT district.the_geom FROM ' + app.districtTable + ' AS district WHERE ' + app.districtFieldName + ' = ' + app.districtNumber;

    // now select the distinct routes that intersect that geometry
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";



    // find out when all of the bar charts and text infographics have loaded so we can set the height of the map
    app.reportCardLoaded = 9;

    // update data vis text
    app.updateTextDataVis(routesWithinSQL, districtGeomSQL);


}

// pull data and update text based on selected district
app.updateTextDataVis = function(routesWithinSQL, districtGeomSQL) {
    // set district name

    $('.districtName').text(app.printDistrict + ' ' + app.districtNumber);

    // calculate number of bus routes that fall within this district
    app.sqlclient.execute(routesWithinSQL)
        .done(function(data) {
            // create array of routes that fall with the district so we don't ahve to hit the DB with a spatial query every time
            app.routeIDArray = [];
            for (var i = 0; i < data.rows.length; i++) {
                app.routeIDArray.push("'" + String(data.rows[i].route_id) + "'");
            }

            // start remaining SQL queries
            getAverages();

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


    // calculate the average speed, ridership and bunching for routes intersecting the district weighted by ridership
    function getAverages() {
        var avgWeightedQuery = 'SELECT sum(ridershiptable.year_2015) AS ridership, sum(speedtable.speed * ridershiptable.year_2015) / sum(ridershiptable.year_2015) AS wavgspeed, sum(bunchingtable.prop_bunched * ridershiptable.year_2015) / sum(ridershiptable.year_2015) AS wavgbunching FROM speed_by_route_10_2015_05_2016 AS speedtable, mta_nyct_bus_avg_weekday_ridership AS ridershiptable, bunching_10_2015_05_2016 AS bunchingtable WHERE speedtable.route_id = ridershiptable.route_id AND speedtable.route_id = bunchingtable.route_id AND ridershiptable.route_id IN (' + app.routeIDArray.join(",") + ') AND ridershiptable.year_2015 IS NOT NULL';
        app.sqlclient.execute(avgWeightedQuery)
            .done(function(data) {
                $({ countNum: $('#totalRidership').text().replace(',', '') }).animate({ countNum: data.rows[0].ridership }, {
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

                $({ countNum: $('#avgSpeedWeighted').text() }).animate({ countNum: data.rows[0].wavgspeed.toFixed(1) }, {
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

                        app.avgSpeedWeighted = this.countNum;

                        // update speed gauge
                        app.speedGaugeObject.update(app.avgSpeedWeighted);

                        // pull the routes within the boroughs
                        getBoroughGeoms();

                    }
                });

                // calculate average bunching numerator and denominator
                var moreThanAlmost = '';
                if (data.rows[0].wavgbunching > 0.1) {
                	// greater than 10 %, greatest fraction demoninator should be 10 and we can say "more than" or "almost" depending on how close the value is
                	f = new Decimal(data.rows[0].wavgbunching).toFraction(10);
                } else if (data.rows[0].wavgbunching >= 0.045) {
                	f = new Decimal(data.rows[0].wavgbunching).toFraction(20);
                } else {
                	f = new Decimal(data.rows[0].wavgbunching).toFraction(50);
                }

            	// check the fraction against the actual value
            	if ((f[0]/f[1]) < data.rows[0].wavgbunching && (data.rows[0].wavgbunching - (f[0]/f[1])) > 0.0025 ) {
            		$('#moreThanAlmost').text('More than');
            	} else if ((f[0]/f[1]) > data.rows[0].wavgbunching && ((f[0]/f[1]) - data.rows[0].wavgbunching) > 0.0025 ) {
            		$('#moreThanAlmost').text('Almost');
            	} else {
            		$('#moreThanAlmost').text('');
            	}


                app.avgBunchingWeighted = (data.rows[0].wavgbunching * 100).toFixed(1);

                // update bunching key
                app.bunchingKey(app.avgBunchingWeighted);


                $({ countNum: $('#avgBunchingWeightedNumerator').text() }).animate({ countNum: f[0] }, {
                    duration: 1000,
                    easing: 'linear',
                    step: function() {
                        if (this.countNum) {
                            $('#avgBunchingWeightedNumerator').text(parseInt(this.countNum));
                        } else {
                            $('#avgBunchingWeightedNumerator').text('0');
                        }
                    },
                    complete: function() {
                        $('#avgBunchingWeightedNumerator').text(parseInt(this.countNum));
                        app.reportCardLoaded--;
                        if (app.reportCardLoaded == 0) {
                            app.calcMapHeightAndLoad();
                        }


                    }
                });

                $({ countNum: $('#avgBunchingWeightedDemominator').text() }).animate({ countNum: f[1] }, {
                    duration: 1000,
                    easing: 'linear',
                    step: function() {
                        if (this.countNum) {
                            $('#avgBunchingWeightedDemominator').text(parseInt(this.countNum));
                        } else {
                            $('#avgBunchingWeightedDemominator').text('0');
                        }
                    },
                    complete: function() {
                        $('#avgBunchingWeightedDemominator').text(parseInt(this.countNum));
                        app.reportCardLoaded--;
                        if (app.reportCardLoaded == 0) {
                            app.calcMapHeightAndLoad();
                        }

                    }
                });

                $({ countNum: $('#avgBunchingWeightedPct').text() }).animate({ countNum: app.avgBunchingWeighted }, {
                    duration: 1000,
                    easing: 'linear',
                    step: function() {
                        if (this.countNum) {
                            $('#avgBunchingWeightedPct').text(parseFloat(this.countNum).toFixed(1));
                        } else {
                            $('#avgBunchingWeightedPct').text('0');
                        }
                    },
                    complete: function() {
                        $('#avgBunchingWeightedPct').text(parseFloat(this.countNum).toFixed(1));
                    }
                });


            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });

    }


    function getBoroughGeoms() {
        var boroughGeomSQL = "SELECT ST_AsText(borough.the_geom) FROM nyc_borough_boundaries AS borough WHERE ST_Intersects( borough.the_geom, (" + districtGeomSQL + ") )";
        app.sqlclient.execute(boroughGeomSQL)
            .done(function(data) {
                var count = data.rows.length - 1;
                // create array of routes that fall with the borough(s)
                app.boroughRouteIDArray = [];
                // create array of borough geoms
                for (var i = 0; i < data.rows.length; i++) {
                    var routesWithinBoroughSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( ST_AsText(mta.the_geom)::geometry, '" + data.rows[i].st_astext + "'::geometry)";
                    app.sqlclient.execute(routesWithinBoroughSQL)
                        .done(function(data_j) {
                            for (var j = 0; j < data_j.rows.length; j++) {
                                app.boroughRouteIDArray.push("'" + String(data_j.rows[j].route_id) + "'");
                            }

                            if (count = i) {
                                getExtremes();
                            }

                        })
                        .error(function(errors) {
                            // errors contains a list of errors
                            console.log("errors:" + errors);
                        });


                }



            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });
    }

    // function getRoutesWithinBoroughs(boroughGeom) {
    //     // query the borough boundaries to see which routes fall within each borough

    //     var routesWithinBoroughSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( mta.the_geom , " + boroughGeom + ")";
    //     app.sqlclient.execute(routesWithinBoroughSQL)
    //         .done(function(data) {
    //             for (var i = 0; i < data.rows.length; i++) {
    //                 app.boroughRouteIDArray.push("'" + String(data.rows[i].route_id) + "'");
    //             }

    //         })
    //         .error(function(errors) {
    //             // errors contains a list of errors
    //             console.log("errors:" + errors);
    //         });

    // }


    function getExtremes() {
        var extremesQuery = 'SELECT max(ridership.year_2015) AS maxridership, max(ridership.prop_change_2010_2015) AS maxpropridership, max(bunching.prop_bunched) AS maxbunching, max(speed.speed) AS maxspeed FROM mta_nyct_bus_avg_weekday_ridership AS ridership, bunching_10_2015_05_2016 AS bunching, speed_by_route_10_2015_05_2016 AS speed WHERE ridership.route_id IN (' + app.boroughRouteIDArray.join(",") + ') AND ridership.year_2015 IS NOT NULL';
        app.sqlclient.execute(extremesQuery)
            .done(function(data) {
                app.maxBunching = data.rows[0].maxbunching * 100;
                app.maxPropRidership = data.rows[0].maxpropridership * 100;
                app.maxRidership = data.rows[0].maxridership;
                app.maxSpeed = data.rows[0].maxspeed;

                // run bar chart update function
                app.updateBarCharts();

            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });

    }


}

// pull data and creates bar charts for selected district
app.updateBarCharts = function() {

    // using the routes selected by district, build a query for top three routes in ridership
    var ridershipQuery = 'SELECT route_id, year_2015, note FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND year_2015 IS NOT NULL ORDER BY year_2015 DESC LIMIT 3 ';

    app.sqlclient.execute(ridershipQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
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
                app.updateBarChart('#ridership', app.blueColorScale, ridershipArray);
            } else {
                app.createBarChart('#ridership', app.blueColorScale, ridershipArray);
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
    var fastestGrowingQuery = 'SELECT route_id, prop_change_2010_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND prop_change_2010_2015 >= 0 AND prop_change_2010_2015 IS NOT NULL ORDER BY prop_change_2010_2015 DESC LIMIT 3 ';


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
                app.updateBarChart('#fastestGrowing', app.blueColorScale, fastestGrowingArray);
            } else {
                app.createBarChart('#fastestGrowing', app.blueColorScale, fastestGrowingArray);
            }

            if (fastestGrowingArray.length == 0) {
                $('#fastestGrowing').html('');
                $('#noneGrowing').html('<p>There are no routes with growing ridership in this district.</p>');
            } else {
                $('#noneGrowing').html('');
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
    var mostBunchingQuery = 'SELECT route_id, prop_bunched FROM bunching_10_2015_05_2016 WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND prop_bunched IS NOT NULL ORDER BY prop_bunched DESC LIMIT 3';

    app.sqlclient.execute(mostBunchingQuery)
        .done(function(data) {
            // take the first route returned and populate link 
            $('#individual_report_card').attr("href", "/?route=" + data.rows[0].route_id)
            // create data object and pass to bar chart for the form
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
    var slowestQuery = 'SELECT route_id, speed FROM speed_by_route_10_2015_05_2016 WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND speed IS NOT NULL ORDER BY speed ASC LIMIT 3';

    app.sqlclient.execute(slowestQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
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

    var width = $('.bar-chart-wrapper').width(),
        barHeight = 25,
        barWidth = width * (3 / 4);

    var x = d3.scaleLinear()

    if (divId === '#fastestGrowing') {
        x.range([0, barWidth]);
        if (app.maxPropRidership > 100) {
            app.maxPropRidership = 110;
            x.domain([0, app.maxPropRidership]);
        } else {
            x.domain([0, 100]);
        }
    } else if (divId === '#mostBunching') {
        x.range([barWidth / 7, barWidth]);
        x.domain([0, app.maxBunching]);
    } else if (divId === '#slowest') {
        x.range([barWidth / 7, barWidth]);
        x.domain([0, app.maxSpeed]);
    } else if (divId === '#ridership') {
        x.range([barWidth / 7, barWidth]);
        x.domain([0, app.maxRidership]);
    }

    var chart = d3.select(divId)
        .select('svg')
        .attr("width", width)
        .attr("height", barHeight * data.length);

    // update
    var barChartGs = chart.selectAll("g")
        .data(data)
        .on('click', function(d) {
            app.highlightRoute(d.label);
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
            if (divId === '#fastestGrowing' && d.value > 110) {
                return x(110);
            } else {
                return x(d.value);
            }
        });

    barChartGs.select('.inside-bar-text')
        .attr("class", function(d) {
            if (divId === '#fastestGrowing' && d.value < 15) {
                return "inside-bar-text outside";
            } else {
                return "inside-bar-text";
            }  
        })
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
            if (divId === '#fastestGrowing' && d.value > 110) {
                return x(110) - 7;
            } else if (divId === '#fastestGrowing' && d.value < 15) {
                return x(d.value) + 6;
            } else {
                return x(d.value) - 7;
            }
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
            if (divId === '#fastestGrowing' && d.value > 110) {
                return x(110) + 6;
            } else if (divId === '#fastestGrowing' && d.value < 15) {
                return x(d.value) + 45;
            } else {
                return x(d.value) + 6;
            }
        });

    // enter
    var enterBars = barChartGs.enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * barHeight + ")";
        })
        .attr("class", "clickable-g-container")
        .on('click', function(d) {
            app.highlightRoute(d.label);
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
            if (divId === '#fastestGrowing' && d.value > 110) {
                return x(110);
            } else {
                return x(d.value);
            }

        });

    enterBars.append("text")
        .attr("class", function(d) {
            if (divId === '#fastestGrowing' && d.value < 15) {
                return "inside-bar-text outside";
            } else {
                return "inside-bar-text";
            }  
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
        })
        .attr("x", 10)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            if (divId === '#fastestGrowing' && d.value > 110) {
                return x(110) - 7;
            } else if (divId === '#fastestGrowing' && d.value < 15) {
                return x(d.value) + 6;
            } else {
                return x(d.value) - 7;
            }
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
            if (divId === '#fastestGrowing' && d.value > 110) {
                return x(110) + 6;
            } else if (divId === '#fastestGrowing' && d.value < 15) {
                return x(d.value) + 45;
            } else {
                return x(d.value) + 6;
            }
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

    app.map = L.map('district-map', { scrollWheelZoom: false, center: [40.74, -73.89], zoom: 11, closePopupOnClick: true, zoomControl: false, tap: true, });

    // if ($('.district-map-holder').css('position') == 'fixed') {
    //     app.toggleDistrictMap = true;
    //     app.zoomControls = new L.Control.Zoom({ position: 'topleft' }).addTo(app.map);
    //     // destroy tooltips
    //     $('.bar-chart-wrapper').tooltip('destroy');
    // } else {
    //     app.toggleDistrictMap = false;
    // }

    app.zoomControls = new L.Control.Zoom({ position: 'topleft' }).addTo(app.map);

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

    // remove all polygons from the map
    for (var key in app.polygons) {
        if (app.map.hasLayer(app.polygons[key][0])) {
            app.map.removeLayer(app.polygons[key][0]);
        }     
    }

    app.polygons = {};

    function geometryHover(layer, options) {

        options = options || {}
        var HIGHLIGHT_STYLE = {
            weight: 3,
            color: '#FF6600',
            opacity: 1,
            fillColor: 'rgb(184, 233, 134)',
            fillOpacity: 0.4
        };
        var style = {
            weight: 1,
            color: '#FF6600',
            opacity: 1,
            fillColor: '#fff',
            fillOpacity: 0,            
        }

        var polygonsHighlighted = [];


        // fetch the geometry
        var sql = new cartodb.SQL({ user: app.username, format: 'geojson' });
        sql.execute("select cartodb_id, " + app.districtFieldName + " as districtNum, the_geom as the_geom from (" + layer.getSQL() + ") as _wrap").done(function(geojson) {
            var features = geojson.features;
            for (var i = 0; i < features.length; ++i) {
                var f = geojson.features[i];
                var key = f.properties.cartodb_id

                // generate geometry
                //var geometry = L.GeoJSON.geometryToLayer(features[i].geometry);
                var geo = L.geoJson(features[i], {
                    onEachFeature: function(feature, layer) {
                        layer.on('click', function() {
                            app.districtNumber = feature.properties.districtnum;
                            if (app.selectDistrictNumberMenu) {
                                app.selectDistrictNumberMenu.val(app.districtNumber).trigger("change");
                            } else {
                                $("#number").val(app.districtNumber);
                                // add loading modal
                                $("body").addClass("loading");
                                // update route selection and data
                                app.selectRoutes();
                                // create url parameters
                                window.history.pushState({}, '', '?district=' + $('#selectDistrict').val() + $('#number').val());
                            }
                        });

                        layer.on('mouseover', featureOver);
                        layer.on('mouseout', featureOut);
                        
                    }
                });

                geo.setStyle(style);
                geo.addTo(app.map);

                // add to polygons
                app.polygons[key] = app.polygons[key] || [];
                app.polygons[key].push(geo);
            }
        });

        function featureOver(e) {
            featureOut();
            var pol = app.polygons[e.target.feature.properties.cartodb_id] || [];
            for (var i = 0; i < pol.length; ++i) {
                pol[i].setStyle(HIGHLIGHT_STYLE);
                polygonsHighlighted.push(pol[i]);
            }
        }

        function featureOut() {
            var pol = polygonsHighlighted;
            for (var i = 0; i < pol.length; ++i) {
                pol[i].setStyle(style);
            }
            polygonsHighlighted = [];
        }


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
        .done(function(layer) {
            app.allDistrictLayer = layer;
            layer.setInteraction(true);
            app.districtSublayer = layer.getSubLayer(0);
            geometryHover(app.districtSublayer);

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
                cartocss: '#layer {line-width: 3;line-color: #FF6600;line-opacity: 1;polygon-fill: rgb(184, 233, 134);polygon-opacity: 0.4;}',
            }]
        })
        .addTo(app.map)
        .done(function(layer) {
            app.activeAjaxConnections--;

            app.districtLayer = layer;
            app.sqlclient.getBounds(districtMapSQL).done(function(bounds) {
                app.bounds = bounds;
                app.map.fitBounds(app.bounds);

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
                    "cartocss": "#layer {line-width: 3;line-color: #FF6600;line-opacity: 1;polygon-fill: rgb(184, 233, 134);polygon-opacity: 0.4;}",
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


app.speedGauge = function(container, configuration) {
    var that = {};
    var config = {
        size: 200,
        clipWidth: 200,
        clipHeight: 110,
        ringInset: 20,
        ringWidth: 20,

        pointerWidth: 10,
        pointerTailLength: 5,
        pointerHeadLengthPercent: 0.9,

        minValue: 0,
        maxValue: 10,

        minAngle: -90,
        maxAngle: 90,

        transitionMs: 1000,

        majorTicks: 5,
        labelFormat: d3.format(',d'),
        labelInset: 10,

        arcColorFn: d3.scaleLinear().domain([0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]).range(['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#a6d96a', '#1a9850']),
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
    var pointerLine = d3.line();
    var baPg = undefined;
    var baPointer = undefined;
    var baPointerText = undefined;

    var donut = d3.pie();

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
        for (prop in configuration) {
            config[prop] = configuration[prop];
        }

        range = config.maxAngle - config.minAngle;
        r = config.size / 2;
        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

        // a linear scale that maps domain values to a percent from 0..1
        scale = d3.scaleLinear()
            .range([0, 1])
            .domain([config.minValue, config.maxValue]);

        ticks = scale.ticks(config.majorTicks);
        tickData = d3.range(config.majorTicks).map(function() {
            return 1 / config.majorTicks;
        });

        arc = d3.arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset)
            .startAngle(function(d, i) {
                var ratio = d * i;
                return deg2rad(config.minAngle + (ratio * range));
            })
            .endAngle(function(d, i) {
                var ratio = d * (i + 1);
                return deg2rad(config.minAngle + (ratio * range));
            });

        // arcs for text labels
        arcLabels = d3.arc()
            .innerRadius(r - config.ringWidth + 10)
            .outerRadius(r - config.ringInset + 10)
            .startAngle(-90 * (Math.PI / 180))
            .endAngle(90 * (Math.PI / 180));

    }
    that.configure = configure;

    function centerTranslation() {
        return 'translate(' + r + ',' + r + ')';
    }

    function belowleftcenterTranslation() {
        return 'translate(' + (r) + ',' + (r + 20) + ')';
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

        var avgSpeed = config.maxValue / 2;
        ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
        var lg = svg.append('g')
            .attr('class', 'label')
            .attr('transform', centerTx);
        lg.selectAll('text')
            .data(ticks)
            .enter().append('text')
            .attr('transform', function(d) {
                var ratio = scale(d);
                var newAngle = config.minAngle + (ratio * range);
                return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
            })
            .text(config.labelFormat);


        var lineData = [
            [config.pointerWidth / 2, 0],
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0]
        ];

        // pointer line
        var pg = svg.append('g').data([lineData])
            .attr('class', 'pointer')
            .attr('transform', centerTx);

        pointer = pg.append('path')
            .attr('d', pointerLine)
            .attr('transform', 'rotate(' + config.minAngle + ')');


        // mph text
        var belowleftcenterTx = belowleftcenterTranslation();
        var mphText = svg.append('g')
            .attr('class', 'label')
            .attr('transform', belowleftcenterTx);
        mphText.append('text')
            .text('mph');


        update(newValue === undefined ? 0 : newValue, []);
    }
    that.render = render;

    function update(newValue, newConfiguration) {
        if (newConfiguration !== undefined) {
            configure(newConfiguration);
        }
        var ratio = scale(newValue);
        var newAngle = config.minAngle + (ratio * range);
        var ease = d3.easeLinearIn;
        pointer.transition()
            .duration(config.transitionMs)
            .ease(d3.easeElasticOut)
            .attr('transform', 'rotate(' + newAngle + ')');

    }


    that.update = update;

    configure(configuration);

    return that;
}

app.bunchingKey = function(districtAvg) {

    var leftScale = d3.scaleLinear()
        .domain([0, 20])
        .range([0, 100]);

    d3.select("#district-average-vertical-container")
        .style('left', leftScale(districtAvg) + '%');

    d3.select("#district-average-vertical-container p")
        .text(districtAvg + '%');

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
app.blueColorScale = d3.scaleLinear()
    .domain([0, app.maxRidership])
    .range(['#aaa', '#aaa']);

app.mostBunchingColorScale = d3.scaleLinear()
    .domain([0, 2.857, 5.714, 8.571, 11.428, 14.285, 17.1428, 20])
    .range(['#1a9850', '#a6d96a', '#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d73027', '#a50026']);

app.slowestColorScale = d3.scaleLinear()
    .domain([0, 2.714, 5.4285, 8.1428, 10.8571, 13.5714, 16.2857, 19])
    .range(['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#a6d96a', '#1a9850']);



// calculating if all ajax connections are complete
app.activeAjaxConnections = 0;
