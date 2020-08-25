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

    //update share buttons
    app.updateShareButtons();

};

// sets up listeners
app.createListeners = function() {

    var selectDistrict, numberOfDistrict;
    // listen for on change to update dropdown menu
    $('#selectDistrict').change(function() {
        app.districtName = $(this).val();
        // update route selection and data
        app.updateNumberDropdown();
        selectDistrict = $(this).val();
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

        numberOfDistrict = $(this).val();

        app.updateShareButtons(selectDistrict, numberOfDistrict);


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
        app.districtTable = 'nyc_state_senate_district_averages_2019';
        app.districtFieldName = 'stsendist';
        app.printDistrict = 'State Senate District';
    } else if (app.districtName == 'assembly') {
        // State Assembly
        app.districtTable = 'nyc_state_assembly_district_averages_2019';
        app.districtFieldName = 'assem_dist';
        app.printDistrict = 'State Assembly District';
    } else if (app.districtName == 'council') {
        // City Council
        app.districtTable = 'nyc_city_council_district_averages_2019';
        app.districtFieldName = 'coun_dist';
        app.printDistrict = 'City Council District';
    } else {
        // Community Board
        app.districtTable = 'nyc_community_district_averages_2019';
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
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";



    // find out when all of the bar charts and text infographics have loaded so we can set the height of the map
    app.reportCardLoaded = 12;

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

        // pull averages and grades for this district
        var avgAndGradesQuery = 'SELECT district.wavgspeed, district.wavgbunching, district.ridership, district.ridership_change_17_18, district.wavgotp, district.speed_grade, district.reliablity_grade, district.overall_grade, district.slower_than, district.worse_than FROM ' + app.districtTable + ' AS district WHERE ' + app.districtFieldName + ' = ' + app.districtNumber;
        app.sqlclient.execute(avgAndGradesQuery)
            .done(function(data) {

                // overall letter grade
                $('#overall-grade').text(data.rows[0].overall_grade);
                $('#os-js-final-grade').attr('class', 'os-card');
                $('#os-js-final-grade').addClass(data.rows[0].overall_grade);

                // worse than percent
                $('#worse-than').text(data.rows[0].worse_than);

                // worse than type of district
                $('#district-type').text(app.printDistrict);

                // ridership counter
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

                // change in ridership counter
                app.ridership_change_16_17 = (data.rows[0].ridership_change_16_17 * 100).toFixed(1);
                if (app.ridership_change_16_17 >=0 ) {
                    $('#ridershipIncreaseOrDecrease').text('increase');
                } else {
                    $('#ridershipIncreaseOrDecrease').text('decrease');
                }

                $({ countNum: $('#ridershipChange').text() }).animate({ countNum: app.ridership_change_16_17 }, {
                    duration: 1000,
                    easing: 'linear',
                    step: function() {
                        if (this.countNum) {
                            $('#ridershipChange').text(parseFloat(this.countNum).toFixed(1));
                        } else {
                            $('ridershipChange').text('0');
                        }
                    },
                    complete: function() {
                        $('#ridershipChange').text(parseFloat(this.countNum).toFixed(1));

                        app.reportCardLoaded--;
                        if (app.reportCardLoaded == 0) {
                            app.calcMapHeightAndLoad();
                        }
                    }
                });


                // speed grade
                $('#speed-grade').text(data.rows[0].speed_grade);
                $('#os-js-speed-grade').attr('class', 'os-card');
                $('#os-js-speed-grade').addClass('small');
                $('#os-js-speed-grade').addClass(data.rows[0].speed_grade);   
                
                // slower than
                $('#slower-than').text(data.rows[0].slower_than);


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

                    }
                });


                // reliability grade
                $('#reliablity-grade').text(data.rows[0].reliablity_grade);
                $('#os-js-reliablity-grade').attr('class', 'os-card');
                $('#os-js-reliablity-grade').addClass('small');
                $('#os-js-reliablity-grade').addClass(data.rows[0].reliablity_grade);                    


                // bunching metric
                app.avgBunchingWeighted = (data.rows[0].wavgbunching * 100).toFixed(1);

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

                        app.reportCardLoaded--;
                        if (app.reportCardLoaded == 0) {
                            app.calcMapHeightAndLoad();
                        }
                        
                    }
                });

                // on-time performace metric
                app.avgOnTimePct = (data.rows[0].wavgotp * 100).toFixed(1);

                $({ countNum: $('#avgOnTimePct').text() }).animate({ countNum: app.avgOnTimePct }, {
                    duration: 1000,
                    easing: 'linear',
                    step: function() {
                        if (this.countNum) {
                            $('#avgOnTimePct').text(parseFloat(this.countNum).toFixed(1));
                        } else {
                            $('#avgOnTimePct').text('0');
                        }
                    },
                    complete: function() {
                        $('#avgOnTimePct').text(parseFloat(this.countNum).toFixed(1));

                        app.reportCardLoaded--;
                        if (app.reportCardLoaded == 0) {
                            app.calcMapHeightAndLoad();
                        }
                        
                        // pull the routes within the boroughs
                        getBoroughGeoms();
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
                // create array of routes that fall with the borough(s)
                app.boroughRouteIDArray = [];
                // create array of borough geoms
                for (var i = 0; i < data.rows.length; i++) {
                    var routesWithinBoroughSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( ST_AsText(mta.the_geom)::geometry, '" + data.rows[i].st_astext + "'::geometry)";
                    app.sqlclient.execute(routesWithinBoroughSQL)
                        .done(function(data_j) {
                            for (var j = 0; j < data_j.rows.length; j++) {
                                app.boroughRouteIDArray.push("'" + String(data_j.rows[j].route_id) + "'");
                            }

                            if (i = data.rows.length) {
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



    function getExtremes() {
        var extremesQuery = 'SELECT max(otp.prop_on_time) AS maxotp, max(bunching.prop_bunched) AS maxbunching, max(speed.speed) AS maxspeed FROM otp_by_route_05_2019_10_2019 AS otp, bunching_by_route_05_2019_10_2019 AS bunching, speed_by_route_05_2019_10_2019 AS speed WHERE speed.route_id IN (' + app.boroughRouteIDArray.join(",") + ')';
        app.sqlclient.execute(extremesQuery)
            .done(function(data) {
                app.maxOTP = data.rows[0].maxotp * 100;
                app.maxBunching = data.rows[0].maxbunching * 100;
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
    var ridershipQuery = 'SELECT ridership.route_id, ridership.year_2018, grades.final_grade FROM mta_nyct_bus_avg_weekday_ridership_2018 AS ridership, route_grades_19 AS grades WHERE ridership.route_id = grades.route AND ridership.route_id IN (' + app.routeIDArray.join(",") + ') AND ridership.year_2018 IS NOT NULL AND grades.final_grade <> \'NA\' ORDER BY ridership.year_2018 DESC LIMIT 3 ';

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
                ridershipArray.push({ label: label, value: data.rows[i].year_2018, grade: data.rows[i].final_grade });

            }

            // check for existance of SVG and update chart if it already esists
            app.createRidershipTable(ridershipArray);

            app.createNotesForRidershipBarChart($('#ridershipNotes'), ridershipNotesArray);

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
    var fastestGrowingQuery = 'SELECT ridership.route_id, ridership.pct_dif_17_18, grades.final_grade FROM mta_nyct_bus_avg_weekday_ridership_2018 AS ridership, route_grades_19 AS grades WHERE ridership.route_id = grades.route AND ridership.route_id IN (' + app.routeIDArray.join(",") + ') AND ridership.pct_dif_17_18 >= 0 AND ridership.pct_dif_17_18 IS NOT NULL AND grades.final_grade <> \'NA\' ORDER BY ridership.pct_dif_17_18 DESC LIMIT 3 ';


    app.sqlclient.execute(fastestGrowingQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var fastestGrowingArray = [];
            var fastestGrowingRidershipNotesArray = []
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                if (data.rows[i].prop_change_note) {
                    fastestGrowingRidershipNotesArray.push(data.rows[i].prop_change_note);
                    label = data.rows[i].route_id + '*'
                } else {
                    label = data.rows[i].route_id;
                }
                pct = parseFloat((data.rows[i].pct_dif_17_18 * 100).toFixed());
                fastestGrowingArray.push({ label: label, value: pct });
            }

            // make cards for changing ridership 
            var el = "#changing-ridership";
            app.createChangingRidershipCards(fastestGrowingArray, el);

            app.createNotesForRidershipBarChart($('#fastestGrowingRidershipNotes'), fastestGrowingRidershipNotesArray);

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


    // using the routes selected by district, build a query for top three routes by fastest growing
    var fastestDecreasingQuery = 'SELECT ridership.route_id, ridership.pct_dif_17_18, grades.final_grade FROM mta_nyct_bus_avg_weekday_ridership_2018 AS ridership, route_grades_19 AS grades WHERE ridership.route_id = grades.route AND ridership.route_id IN (' + app.routeIDArray.join(",") + ') AND ridership.pct_dif_17_18 < 0 AND ridership.pct_dif_17_18 IS NOT NULL AND grades.final_grade <> \'NA\' ORDER BY ridership.pct_dif_17_18 ASC LIMIT 3 ';


    app.sqlclient.execute(fastestDecreasingQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
            var fastestDecreasingArray = [];
            var fastestDecreasingRidershipNotesArray = []
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                if (data.rows[i].prop_change_note) {
                    fastestDecreasingRidershipNotesArray.push(data.rows[i].prop_change_note);
                    label = data.rows[i].route_id + '*'
                } else {
                    label = data.rows[i].route_id;
                }
                pct = parseFloat((data.rows[i].pct_dif_17_18 * 100).toFixed());
                fastestDecreasingArray.push({ label: label, value: pct });
            }

            // make cards for changing ridership 
            var el = "#decrease-ridership";
            app.createChangingRidershipCards(fastestDecreasingArray, el);

            app.createNotesForRidershipBarChart($('#fastestDecreasingRidershipNotes'), fastestDecreasingRidershipNotesArray);

            if (fastestDecreasingArray.length == 0) {
                $('#noneDecreasing').html('<p>There are no routes with decreasing ridership in this district.</p>');
            } else {
                $('#noneDecreasing').html('');
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
    var mostBunchingQuery = 'SELECT route_id, prop_bunched, bunch_grade FROM bunching_by_route_05_2019_10_2019 WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND prop_bunched IS NOT NULL AND freq = 1 ORDER BY prop_bunched DESC LIMIT 3';

    app.sqlclient.execute(mostBunchingQuery)
        .done(function(data) {
            // take the first route returned and populate link
            $('#individual_report_card').attr("href", "http://busturnaround.nyc/routes/" + data.rows[0].route_id)
            // create data object and pass to bar chart for the form
            var mostBunchingArray = [];
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                pct = parseFloat((data.rows[i].prop_bunched * 100).toFixed(1));
                mostBunchingArray.push({ label: data.rows[i].route_id, value: pct, grade:data.rows[i].bunch_grade });
            }

            // check for existance of SVG and update chart if it already esists
            if ($('#mostBunching').html()) {
                app.updateBarChart('#mostBunching', mostBunchingArray);
            } else {
                app.createBarChart('#mostBunching', mostBunchingArray);
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
    var slowestQuery = 'SELECT route_id, speed, speed_grade FROM speed_by_route_05_2019_10_2019 WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND speed IS NOT NULL ORDER BY speed ASC LIMIT 3';

    app.sqlclient.execute(slowestQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            var slowestArray = [];
            var num;
            for (var i = 0; i < data.rows.length; i++) {
                num = parseFloat(data.rows[i].speed.toFixed(1));
                slowestArray.push({ label: data.rows[i].route_id, value: num, grade: data.rows[i].speed_grade });
            }

            // check for existance of SVG and update chart if it already esists
            if ($('#slowest').html()) {
                app.updateBarChart('#slowest', slowestArray);
            } else {
                app.createBarChart('#slowest', slowestArray);
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

    // using the routes selected by district, build a query for top three worst performing on time routes
    var otpQuery = 'SELECT route_id, prop_on_time, on_time_grade FROM otp_by_route_05_2019_10_2019 WHERE route_id IN (' + app.routeIDArray.join(",") + ') AND prop_on_time IS NOT NULL AND freq = 0 ORDER BY prop_on_time ASC LIMIT 3';

    app.sqlclient.execute(otpQuery)
        .done(function(data) {
            // create data object and pass to bar chart for the form
            var otpArray = [];
            var pct;
            for (var i = 0; i < data.rows.length; i++) {
                pct = parseFloat((data.rows[i].prop_on_time * 100).toFixed(1));
                otpArray.push({ label: data.rows[i].route_id, value: pct, grade:data.rows[i].on_time_grade });
            }

            // check for existance of SVG and update chart if it already esists
            if ($('#onTime').html()) {
                app.updateBarChart('#onTime', otpArray);
            } else {
                app.createBarChart('#onTime', otpArray);
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

app.createBarChart = function(divId, data) {

    var width = $('.bar-chart-wrapper').width(),
        barHeight = 40;

    var chart = d3.select(divId)
        .append('svg')
        .attr("width", width)
        .attr("height", barHeight * data.length);

    app.updateBarChart(divId, data);

};

app.updateBarChart = function(divId, data) {

    var width = $(divId).width(),
        barHeight = 40,
        barWidth;
    if ((width * (3 / 4)) > 275) {
        barWidth = 275;
    } else {
        barWidth = width * (3 / 4);
    }


    var x = d3.scaleLinear()

    if (divId === '#mostBunching') {
        x.range([barWidth / 7, barWidth]);
        x.domain([0, app.maxBunching]);
    } else if (divId === '#slowest') {
        x.range([barWidth / 7, barWidth]);
        x.domain([0, app.maxSpeed]);
    } else if (divId === '#onTime') {
        x.range([barWidth / 7, barWidth]);
        x.domain([0, app.maxOTP]);
    }

    var chart = d3.select(divId)
        .select('svg')
        .attr("width", width)
        .attr("height", barHeight * data.length);

    // update
    var barChartGs = chart.selectAll("g")
        .data(data);
        // .on('click', function(d) {
        //     app.highlightRoute(d.label);
        // });

    barChartGs.select('rect')
        .attr('fill', function(d) {
            return app.ordinalColorScale(d.grade);
        })
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("width", function(d, i) {
            return x(d.value);
        });

    barChartGs.select('.inside-bar-text')
        .attr("class", "inside-bar-text")
        .text(function(d) {
            if (divId === '#onTime' || divId === '#mostBunching') {
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
            return x(d.value) - 7;
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
            return x(d.value) + 6;
        });

    // enter
    var enterBars = barChartGs.enter().append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * barHeight + ")";
        });
        // .attr("class", "clickable-g-container")
        // .on('click', function(d) {
        //     app.highlightRoute(d.label);
        // });

    enterBars.append("rect")
        .attr('fill', function(d) {
            return app.ordinalColorScale(d.grade);
        })
        .attr("height", barHeight - 10)
        .attr("width", 0)
        .merge(barChartGs)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("width", function(d, i) {
            return x(d.value);
        });

    enterBars.append("text")
        .attr("class", "inside-bar-text")
        .attr("y", (barHeight - 10) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            if (divId === '#onTime' || divId === '#mostBunching') {
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
            return x(d.value) - 7;
        });

    enterBars.append("text")
        .attr("class", "outside-bar-text")
        .attr("y", (barHeight - 10) / 2)
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
            return x(d.value) + 6;
        });

    // exit
    barChartGs.exit()
        .transition()
        .duration(500)
        .style('opacity', '0')
        .remove();

};

app.createRidershipTable = function(data) {
    // throw away any table that already exists
    $('.ridership-table').remove();

    // set up table
    var ridership_table = d3.select("#ridership-table")
        .append("table")
        .classed("ridership-table", true);

    var rows = ridership_table.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    rows.append("td")
        .classed("blue", true)
        .text(function(d, i) {
            return i + 1;
        });

    var middle_row = rows.append("td")
        .classed("middle", true);

    middle_row.append("div")
        .classed("os-card-container", true)
        .classed("os-card-final-grade", true)
        .append("div")
        .attr("class", function(d) {
            return d.grade;
        })
        .classed("os-card", true)
        .classed("very-small", true)

        .append("div")
        .classed("os-card-rating", true)
        .classed("very-small", true)
        .append("span")
        .text(function(d) {
            return d.grade;
        });
        
    middle_row.append("div")
        .classed("route-name", true)
        .text(function(d) {
            return d.label;
        });

    rows.append("td")
        .classed("grey", true)
        .text(function(d) {
            return app.numberWithCommas(d.value);
        });

}

app.createChangingRidershipCards = function(data, el) {
    // throw away any cards that already exists
    $(el).empty();

    // up or down arrow
    var caret = "fa-caret-up";;
    if (el === "#decrease-ridership") {
        caret = "fa-caret-down";
    }

    // create cards
    var cards = d3.select(el).selectAll("div")
        .data(data)
        .enter()
        .append("div")
        .classed("cr-card", true);

    var top_row = cards.append("div")
        .classed("top", true);

    top_row.append("i")
        .classed("fa", true)
        .classed(caret, true)
        .attr("aria-hidden", "true");
    
    top_row.append("span")
        .text(function(d) {
            return " " + d.value + "%";
        });

    cards.append("div")
        .classed("bottom", true)
        .text(function(d) {
            return d.label;
        });

}

app.createNotesForRidershipBarChart = function(div, ridershipNotesArray) {
    // clear previous notes
    div.html('');
    for (var i = ridershipNotesArray.length - 1; i >= 0; i--) {
        div.append("<p><sup>*</sup>" + ridershipNotesArray[i] + "</p>");
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
    var routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND mta.route_id <> 'Bronx Average' AND mta.route_id <> 'Brooklyn Average' AND mta.route_id <> 'Manhattan Average' AND mta.route_id <> 'Queens Average' AND mta.route_id <> 'Staten Island Average' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";

    var districtMapSQL = 'SELECT * FROM ' + app.districtTable + ' AS district WHERE ' + app.districtFieldName + ' = ' + districtNumber;

    var allDistictMapSQL = 'SELECT * FROM ' + app.districtTable + ' AS district';

    var routesMapSQL = 'SELECT * FROM mta_nyct_bus_routes WHERE route_id IN (' + routesWithinSQL + ')';

    var routesWithDataSQL = "SELECT mta.cartodb_id, mta.route_id, mta.the_geom_webmercator, TO_CHAR(CAST(ridership.year_2018 AS numeric), '999G999') AS year_2018, ROUND(CAST(ridership.pct_dif_10_17 AS numeric) * 100, 1) AS pct_dif_10_17, ROUND(CAST(speed.speed AS numeric), 1) AS speed, ROUND(CAST(bunching.prop_bunched AS numeric) * 100, 1) AS prop_bunched FROM mta_nyct_bus_routes AS mta LEFT OUTER JOIN mta_nyct_bus_avg_weekday_ridership_2018 AS ridership ON (mta.route_id = ridership.route_id) LEFT OUTER JOIN speed_by_route_05_2019_10_2019 AS speed ON (mta.route_id = speed.route_id) LEFT OUTER JOIN bunching_by_route_05_2019_10_2019 AS bunching ON (mta.route_id = bunching.route_id) WHERE mta.route_id IN (" + routesWithinSQL + ")";

    // update the map
    // interactive
    app.reportCardMap(districtMapSQL, routesWithDataSQL, routesMapSQL, allDistictMapSQL);

    /**** Removing the static print map for now ****/
    //static map
    app.reportCardMapStatic(districtMapSQL, routesMapSQL);

}


// map set up
app.mapSetup = function() {
    app.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });

    app.map = L.map('district-map', { scrollWheelZoom: false, center: [40.74, -73.89], zoom: 11, closePopupOnClick: true, zoomControl: false, tap: true, });

    // if ($('.district-map-holder').css('position') == 'fixed') {
    //     app.toggleDistrictMap = true;
    //     app.zoomControls = new L.Control.Zoom({ position: 'topleft' }).addTo(app.map);
    //     // destroy tooltips
    //     $('.bar-chart-wrapper').tooltip('destroy');
    // } else {
    //     app.toggleDistrictMap = false;
    // }

    app.zoomControls = new L.Control.Zoom({ position: 'topright' }).addTo(app.map);

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
            weight: 0,
            color: '#FF6600',
            opacity: 0,
            fillColor: 'rgb(1, 48, 68)',
            fillOpacity: 0.4
        };
        var style = {
            weight: 0,
            color: '#FF6600',
            opacity: 0,
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
            sql: routesWithDataSQL,
            cartocss: '#layer {line-width: 2;line-color: #25a9e9; line-opacity: 1;}',
            interactivity: 'cartodb_id, route_id, year_2018, pct_dif_10_17, speed, prop_bunched',
        }]
    })
    .addTo(app.map)
    .done(function(layer) {
        app.routeLayer = layer;
        app.routeLayer.setInteraction(true);

        app.routesSublayer = app.routeLayer.getSubLayer(0);
        app.routesSublayer.setInteraction(true);
        app.routesSublayer.setInteractivity('cartodb_id, route_id, year_2018, pct_dif_10_17, speed, prop_bunched');

        cdb.vis.Vis.addInfowindow(app.map, app.routesSublayer, ['route_id', 'year_2018', 'pct_dif_10_17', 'speed', 'prop_bunched'], { infowindowTemplate: $('#infowindow_template').html() });

        app.routesSublayer.on('featureClick', function(e, pos, latlng, data) {
            app.routeLayer.setCartoCSS('#layer {line-width: 2;line-color: #005777; line-opacity: 1;} #layer[route_id = "' + data.route_id + '"]::z1 {line-width: 4;line-color: #F78C6C; line-opacity: 1;}');
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
                sql: allDistictMapSQL,
                cartocss: '#layer {line-width: 1;line-color: #25a9e9;line-opacity: 1;polygon-opacity: 0;}',
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
                sql: districtMapSQL,
                cartocss: '#layer {line-width: 0;line-color: #FF6600;line-opacity: 0;polygon-fill: rgb(255, 86, 73);polygon-opacity: 0.8;}',
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

    app.routeLayer.setCartoCSS('#layer {line-width: 2;line-color: #005777; line-opacity: 1;} #layer[route_id = "' + routeId + '"]::z1 {line-width: 4;line-color: #F78C6C; line-opacity: 1;}');
    // open infowindow
    // Select one of the geometries from the table
    var sql = "SELECT mta.cartodb_id, mta.route_id, ST_X(ST_Line_Interpolate_Point(ST_LineMerge(mta.the_geom), 0.5)), ST_Y(ST_Line_Interpolate_Point(ST_LineMerge(mta.the_geom), 0.5)), TO_CHAR(CAST(ridership.year_2018 AS numeric), '999G999') AS year_2018, ROUND(CAST(ridership.pct_dif_10_17 AS numeric) * 100, 1) AS pct_dif_10_17, ROUND(CAST(speed.speed AS numeric), 1) AS speed, ROUND(CAST(bunching.prop_bunched AS numeric) * 100, 1) AS prop_bunched FROM mta_nyct_bus_routes AS mta LEFT OUTER JOIN mta_nyct_bus_avg_weekday_ridership_2018 AS ridership ON (mta.route_id = ridership.route_id) LEFT OUTER JOIN speed_by_route_05_2019_10_2019 AS speed ON (mta.route_id = speed.route_id) LEFT OUTER JOIN bunching_by_route_05_2019_10_2019 AS bunching ON (mta.route_id = bunching.route_id) WHERE mta.route_id = '" + routeId + "' LIMIT 1";
    app.sqlclient.execute(sql)
        .done(function(data) {
            // center map on returned lat/lng
            var latLng = new L.LatLng(data.rows[0]['st_y'], data.rows[0]['st_x']);
            app.map.panTo(latLng);

            // now fire a click where the returned point is located
            app.routesSublayer.trigger('featureClick', null, [data.rows[0]['st_y'], data.rows[0]['st_x']], null, { route_id: data.rows[0]['route_id'], speed: data.rows[0]['speed'], prop_bunched: data.rows[0]['prop_bunched'], year_2018: data.rows[0]['year_2018'], pct_dif_10_17: data.rows[0]['pct_dif_10_17'] }, 0);

        })
        .error(function(errors) {
            // errors contains a list of errors
            console.log("errors:" + errors);
        });

};

app.resetRouteStyle = function() {
    app.routeLayer.setCartoCSS('#layer {line-width: 2;line-color: #005777; line-opacity: 1;}');
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
                    "sql": districtMapSQL,
                    "cartocss": "#layer {line-width: 0;line-color: #FF6600;line-opacity: 0;polygon-fill: rgb(255, 86, 73);polygon-opacity: 0.8;}",
                    "cartocss_version": "2.1.1"
                }
            },{
                "type": "mapnik",
                "options": {
                    "sql": routesMapSQL,
                    "cartocss": '#layer {line-width: 2;line-color: #25a9e9; line-opacity: 1;}',
                    "cartocss_version": "2.1.1"
                }
            },
        ]
    }

    var mapWidth = 1200;
    var mapHeight = 900;

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
app.ordinalColorScale = d3.scaleOrdinal()
    .domain(['A', 'B', 'C', 'D', 'F'])
    .range(['#0da8ec', '#6edd82', '#fecf4d', '#ef6e41', '#ff5649']);


// calculating if all ajax connections are complete
app.activeAjaxConnections = 0;



// share buttons
app.updateShareButtons = function(selectDistrict, numberOfDistrict) {

    var typeOfDistrict;

    if (selectDistrict === 'board') {
        typeOfDistrict = 'Community Board';
    } else if (selectDistrict === 'council') {
        typeOfDistrict = 'City Council';
    } else if (selectDistrict === 'senate') {
        typeOfDistrict = 'State Senate'
    } else {
        typeOfDistrict = 'State Assembly'
    }

    var app_id = '1581540325487727';
    var fbdescription = "Here's the report card for the " + typeOfDistrict + " District " + numberOfDistrict + " in NYC. Check out and compare your district here! #busturnaround";
    var fblink = "http://busturnaround.nyc/district/?district=" + selectDistrict + numberOfDistrict;
    var fbpicture = "http://busturnaround.nyc/static/website/css/images/district_report_card_fb.png";
    var fbname = "This is the report card for the " + typeOfDistrict + " District " + numberOfDistrict;
    var fbcaption = "TransitCenter";
    var fbUrl = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&display=popup&description=' + encodeURIComponent(fbdescription) + '&link=' + encodeURIComponent(fblink) + '&redirect_uri=' + encodeURIComponent(fblink) + '&name=' + encodeURIComponent(fbname) + '&caption=' + encodeURIComponent(fbcaption) + '&picture=' + encodeURIComponent(fbpicture);
    var fbOnclick = 'window.open("' + fbUrl + '","facebook-share-dialog","width=626,height=436");return false;';
    $('#showShareFB').attr("href", fbUrl);
    $('#showShareFB').attr("onclick", fbOnclick);


    var twitterlink = "http://busturnaround.nyc/district/?district=" + selectDistrict + numberOfDistrict;
    var via = 'TransitCenter';
    var twittercaption = "Here's the report card for " + typeOfDistrict + " District " + numberOfDistrict + ". View your district here! #busturnaround";
    var twitterUrl = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(twitterlink) + '&via=' + encodeURIComponent(via) + '&text=' + encodeURIComponent(twittercaption);
    var twitterOnclick = 'window.open("' + twitterUrl + '","twitter-share-dialog","width=626,height=436");return false;';
    $('#showShareTwitter').attr("href", twitterUrl);
    $('#showShareTwitter').attr("onclick", twitterOnclick);
}
