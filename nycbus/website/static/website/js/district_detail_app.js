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

    // pull district number out of global district variable -- use this number on initial page load
    var split = district.split('-');
    app.districtName = split[0];
    app.districtNumber = split[1];
    // app.districtNumber = district.replace(/^\D+/g, '');
    // app.districtName = district.replace(/\d+/g, '');
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
        if ($(this).val() == null) {
            app.districtNumber = '';
        } else {
            app.districtNumber = $(this).val();
        }

        // add loading modal
        $("body").addClass("loading");
        // update route selection and data

        $('.districtName').text(app.printDistrict + ' ' + app.districtNumber);

        app.selectRoutes();
        // create url parameters
        window.history.pushState({}, '', '?district=' + app.districtName + '-' + app.districtNumber);
    });
};

app.updateNumberDropdown = function() {
    // clear numbers and destroy select2 box if neccesary
    if ($("#number").hasClass("select2-hidden-accessible")) {
        $("#number").select2("destroy");
    }

    $("#number").html('');

    // select district table and field names
    if (app.districtName == 'citywide') {
        // State Sentate
        app.districtTable = '';
        app.districtFieldName = '';
        app.printDistrict = 'Citywide';
    } else if (app.districtName == 'borough') {
        // Borough
        app.districtTable = 'nyc_borough_boundaries';
        app.districtFieldName = 'boro_name';
        app.printDistrict = 'Borough';
    } else if (app.districtName == 'senate') {
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
    if (app.districtName == 'citywide') {
        app.initSelect2MenuDistrictNumber();
    } else {
        app.createNumberOptions();
    }


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
};


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
};

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
    /********/

// SQL set up to select routes from selected district
app.selectRoutes = function() {

    var routesWithinSQL, districtGeomSQL;

    // set up query to pull geometry for district
    if (app.districtName == 'borough') {
        districtGeomSQL = "SELECT district.the_geom FROM " + app.districtTable + " AS district WHERE " + app.districtFieldName + " = '" + app.districtNumber + "'";
    } else {
        districtGeomSQL = "SELECT district.the_geom FROM " + app.districtTable + " AS district WHERE " + app.districtFieldName + " = " + app.districtNumber;
    }


    // now select the distinct routes that intersect that geometry
    if (app.districtName == 'citywide') {
        routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%'";
    } else {
        routesWithinSQL = "SELECT DISTINCT mta.route_id FROM mta_nyct_bus_routes AS mta WHERE mta.route_id NOT LIKE '%+' AND mta.route_id NOT LIKE 'BXM%' AND mta.route_id NOT LIKE 'BM%' AND mta.route_id NOT LIKE 'QM%' AND mta.route_id NOT LIKE 'X%' AND ST_Intersects( mta.the_geom , (" + districtGeomSQL + ") )";
    }


    // pass routesWithinSQL to bar chart update function
    app.updateBarCharts(routesWithinSQL);

};

app.createDataTable = function() {
    var tablesel = d3.select('.table-data');
    tablesel.selectAll("*").remove();
    var table = tablesel.append('table');
    $('.table-data table').attr('data-sortable', '');
    var thead = table.append('thead');
    var tbody = table.append('tbody');
    var columns = ['ROUTE', 'RIDERSHIP', 'RIDERSHIP CHANGE', 'BUNCHING', 'SPEED'];
    var column_access = ['label', 'ridership', 'ridership_change', 'bunching', 'speed'];
    // append the header row
    thead.append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .text(function(column) {
            return column;
        })
        .attr('data-sortable-type', function(d) {
            if (d == 'ROUTE') {
                return 'alpha';
            } else {
                return 'numeric';
            }
        });

    var rows = tbody.selectAll('tr')
        .data(app.tableArray)
        .enter()
        .append('tr');

    var cells = rows.selectAll('td')
        .data(function(row) {
            return column_access.map(function(column) {
                return { column: column, value: row[column] };
            });
        })
        .enter()
        .append('td')
        .text(function(d) {
            if (d.column === 'ridership_change' || d.column === 'bunching') {
                return d.value + '%';
            } else if (d.column === 'speed') {
                return d.value + ' mph';
            } else if (d.column === 'ridership') {
                return app.numberWithCommas(d.value);
            }
            return d.value;
        });
    // initialize sortable
    window.Sortable.init();
    // initialize sticky header
    $('.table-data table').stickyTableHeaders({ scrollableArea: $('.table-data') });
    $('.table-data table tr td:nth-child(3)').each(function(i, el) {
        var textValue = $(el).text();
        textValue = parseFloat(textValue, 10)
        if (textValue > 0) {
            $(el).css('color', 'green');
        } else {
            $(el).css('color', 'red');
        }
    });
};

// pull data and creates bar charts for selected district
app.updateBarCharts = function(routesWithinSQL) {

    // reset the data populating the table
    app.tableArray = [];

    var slowestQueryFunction = function() {
        // using the routes selected by district, build a query for top three slowest routes
        var slowestQuery = 'SELECT route_id, speed, ranking FROM speed_by_route_10_2015_05_2016 WHERE route_id IN (' + routesWithinSQL + ') AND speed IS NOT NULL ORDER BY speed ASC';

        app.sqlclient.execute(slowestQuery)
            .done(function(data) {
                // create data object and pass to bar chart for the form
                //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
                var slowestArray = [];
                var num;
                for (var i = 0; i < data.rows.length; i++) {
                    num = parseFloat(data.rows[i].speed.toFixed(1));
                    slowestArray.push({ label: data.rows[i].route_id, value: num, ranking: data.rows[i].ranking });
                    for (var j = 0; j < app.tableArray.length; j++) {
                        if (app.tableArray[j].label == data.rows[i].route_id) {
                            app.tableArray[j].speed = num;
                        }
                    }
                }
                // check for existance of SVG and update chart if it already esists
                if ($('#speed').html()) {
                    app.updateBarChart('#speed', slowestArray);
                } else {
                    app.createBarChart('#speed', slowestArray);
                }

                app.createDataTable();

                // remove loading class at the end of the ajax chaing
                $("body").removeClass("loading");
            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });
    };


    var mostBunchingQueryFunction = function() {
        // using the routes selected by district, build a query for top three routes by most bunching
        var mostBunchingQuery = 'SELECT route_id, prop_bunched, ranking FROM bunching_10_2015_05_2016 WHERE route_id IN (' + routesWithinSQL + ') AND prop_bunched IS NOT NULL ORDER BY prop_bunched DESC';

        app.sqlclient.execute(mostBunchingQuery)
            .done(function(data) {
                // create data object and pass to bar chart for the form
                //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
                var bunching = [];
                var pct;
                for (var i = 0; i < data.rows.length; i++) {
                    pct = parseFloat((data.rows[i].prop_bunched * 100).toFixed(1));
                    bunching.push({ label: data.rows[i].route_id, value: pct, ranking: data.rows[i].ranking });
                    for (var j = 0; j < app.tableArray.length; j++) {
                        if (app.tableArray[j].label == data.rows[i].route_id) {
                            app.tableArray[j].bunching = pct;
                        }
                    }
                }

                if ($('#bunching').html()) {
                    app.updateBarChart('#bunching', bunching);
                } else {
                    app.createBarChart('#bunching', bunching);
                }

                slowestQueryFunction();

            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });
    };

    var fastestGrowingQueryFunction = function() {
        // using the routes selected by district, build a query for top three routes by fastest growing
        var fastestGrowingQuery = 'SELECT route_id, prop_change_2010_2015, prop_change_group_rank_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND prop_change_2010_2015 IS NOT NULL ORDER BY prop_change_2010_2015 DESC';

        app.sqlclient.execute(fastestGrowingQuery)
            .done(function(data) {
                // create data object and pass to bar chart for the form
                //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
                var ridershipChange = [];
                var pct;
                for (var i = 0; i < data.rows.length; i++) {
                    pct = parseFloat((data.rows[i].prop_change_2010_2015 * 100).toFixed());
                    ridershipChange.push({ label: data.rows[i].route_id, value: pct, ranking: data.rows[i].prop_change_group_rank_2015 });
                    for (var j = 0; j < app.tableArray.length; j++) {
                        if (app.tableArray[j].label == data.rows[i].route_id) {
                            app.tableArray[j].ridership_change = pct;
                        }
                    }
                }

                if ($('#bunching').html()) {
                    app.updateNegativeBarChart('#ridershipChange', ridershipChange);
                } else {
                    app.createBarChart('#ridershipChange', ridershipChange);
                }
                mostBunchingQueryFunction();

            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });

    };

    var ridershipQueryFunction = function() {
        // using the routes selected by district, build a query for top three routes in ridership

        var ridershipQuery = 'SELECT route_id, year_2015, group_rank_2015 FROM mta_nyct_bus_avg_weekday_ridership WHERE route_id IN (' + routesWithinSQL + ') AND year_2015 IS NOT NULL ORDER BY year_2015 DESC';


        app.sqlclient.execute(ridershipQuery)
            .done(function(data) {
                // create data object and pass to bar chart for the form
                //var data = [{ label: 'B1', value: 12897 }, { label: 'B2', value: 11897 }, { label: 'B3', value: 10000 }];
                var ridershipArray = [];
                for (var i = 0; i < data.rows.length; i++) {
                    ridershipArray.push({ label: data.rows[i].route_id, value: data.rows[i].year_2015, ranking: data.rows[i].group_rank_2015 });
                    app.tableArray.push({ label: data.rows[i].route_id, ridership: data.rows[i].year_2015, ridership_change: '', bunching: '', speed: '' })
                }
                if ($('#bunching').html()) {
                    app.updateBarChart('#ridership', ridershipArray);
                } else {
                    app.createBarChart('#ridership', ridershipArray);
                }
                fastestGrowingQueryFunction();
            })
            .error(function(errors) {
                // errors contains a list of errors
                console.log("errors:" + errors);
            });

    };
    ridershipQueryFunction();
};

app.createBarChart = function(divId, data) {
    var margin = { top: 20, right: 70, bottom: 50, left: 80 };
    var width,
        barHeight = 25;
    var checkWidth = $('.metric-component .chart-component').width() - margin.left - margin.right;
    if (checkWidth > 670) {
        width = 670;
    } else {
        width = checkWidth;
    }
    var checkHeight = (barHeight * (data.length - 1)) - (margin.top - margin.bottom);
    if (checkHeight > 700) {
        height = 700;
        barHeight = (height + (margin.top - margin.bottom)) / (data.length - 1);
    } else {
        height = checkHeight;
    }


    var chart = d3.select(divId)
        .append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var rankG = chart.append('g')
        .classed('rankg', true)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    rankG.append("text")
        .attr("class", "borough-ranking")
        .attr("x", '-30')
        .attr("y", '0')
        .attr("dy", ".35em")
        .attr('text-anchor', 'middle')
        .text('Borough');

    rankG.append("text")
        .attr("class", "borough-ranking")
        .attr("x", '-30')
        .attr("y", '16')
        .attr("dy", ".35em")
        .attr('text-anchor', 'middle')
        .text('Rank');

    rankG.append("line")
        .style("stroke", "#979797")
        .style("shape-rendering", "crispEdges")
        .attr("x1", '-60')
        .attr("x2", '0')
        .attr("y1", '31')
        .attr("y2", '31');

    var marginTopPlus30 = margin.top + 30;
    var mainG = chart.append('g')
        .classed('maing', true)
        .attr("transform", "translate(" + margin.left + "," + marginTopPlus30 + ")");

    var xAxisG = chart.append('g')
        .classed('axis xaxisg', true);

    var yAxisG = chart.append('g')
        .classed('axis yaxisg', true);

    if (divId == "#ridershipChange") {
        app.updateNegativeBarChart(divId, data);
    } else {
        app.updateBarChart(divId, data);
    }


};

app.updateBarChart = function(divId, data) {
    var arr = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (key == 'value') {
                arr.push(data[i][key]);
            }
        }
    }
    var margin = { top: 20, right: 70, bottom: 50, left: 80 };
    var marginTopPlus30 = margin.top + 30;
    var width;
    var checkWidth = $('.metric-component .chart-component').width() - margin.left - margin.right;
    if (checkWidth > 670) {
        width = 670;
    } else {
        width = checkWidth;
    }
    var barHeight = 25,
        barWidth = width * (3 / 4);

    var checkHeight = (barHeight * (data.length - 1)) - (margin.top - margin.bottom);
    if (checkHeight > 700) {
        if (app.districtName === 'citywide') {
            height = 3200;
        } else if (app.districtName === 'borough') {
            height = 1000;
        } else {
            height = 700;
        }
        barHeight = (height + (margin.top - margin.bottom)) / (data.length - 1);
    } else {
        height = checkHeight;
    }
    var totalHeight = height + margin.top;
    var rangeWidth = width - 45;
    var mobileBreakpoint = 425;
    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, function(d, i) {
            return i * barHeight;
        })]);
    var x = d3.scaleLinear()
        .domain([0, d3.max(arr)])
        .range([0, rangeWidth]);
    var chart = d3.select(divId)
        .select('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var mainG = chart.select('.maing');

    var xAxis = d3.axisBottom(x);

    if (window.innerWidth > 425) {
        xAxis.ticks(5);
    } else {
        xAxis.ticks(2);
    }

    var yAxis = d3.axisLeft(y)
        .ticks(0);

    var barChartGs = mainG.selectAll(".bars")
        .data(data)
        .attr("transform", function(d, i) {
            var traslateDown = (i * barHeight);
            return "translate(0," + traslateDown + ")";
        });

    // update
    barChartGs.select('rect')
        .attr('fill', function(d) {
            if (d.label.search('Average') >= 0) {
                return '#417505';
            } else {
                return '#15B6E5';
            }
        })
        .attr("height", barHeight - 5)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("width", function(d, i) {
            return x(d.value);
        });

    barChartGs.select(".bus-value-text")
        .text(function(d) {
            if (divId === '#bunching') {
                return d.value.toFixed(1) + '%';
            } else if (divId === '#speed') {
                return d.value + ' mph';
            }
            return app.numberWithCommas(d.value);
        })
        .attr("y", (barHeight - 5) / 2)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return x(d.value) + 5;
        });

    barChartGs.select(".bus-route")
        .attr("class", function(d) {
            if (d.label.search('Average') >= 0) {
                return 'bus-route bus-route-text-average'
            } else {
                return "bus-route bus-route-text";
            }
        })
        .text(function(d) {
            return d.label;
        })
        .attr("y", (barHeight - 5) / 2)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            if (divId === '#bunching') {
                if (d.value.toFixed(1).length == 4) {
                    return x(d.value) + 52;
                } else {
                    return x(d.value) + 44;
                }
            } else if (divId === '#speed') {
                if (d.value.toFixed(1).length == 4) {
                    return x(d.value) + 70;
                } else {
                    return x(d.value) + 62;
                }
            } else {
                if (d.value.toString().length == 5) {
                    return x(d.value) + 55;
                } else if (d.value.toString().length == 4) {
                    return x(d.value) + 47;
                } else {
                    return x(d.value) + 39;
                }
            }
        });

    barChartGs.select(".borough-ranking")
        .text(function(d) {
            return d.ranking;
        })
        .attr("y", (barHeight - 5) / 2);

    // enter
    var enterBars = barChartGs.enter().append("g")
        .classed('bars', true)
        .attr("transform", function(d, i) {
            var traslateDown = (i * barHeight);
            return "translate(0," + traslateDown + ")";
        });

    enterBars.append("rect")
        .attr('fill', function(d) {
            if (d.label.search('Average') >= 0) {
                return '#417505';
            } else {
                return '#15B6E5';
            }
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
            return x(d.value);
        });

    enterBars.append("text")
        .attr("class", "bus-value-text")
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .attr('text-anchor', 'start')
        .text(function(d) {
            if (divId === '#bunching') {
                return d.value.toFixed(1) + '%';
            } else if (divId === '#speed') {
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
            return x(d.value) + 5;
        });

    enterBars.append("text")
        .attr("class", function(d) {
            if (d.label.search('Average') >= 0) {
                return 'bus-route bus-route-text-average'
            } else {
                return "bus-route bus-route-text";
            }
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .attr('text-anchor', 'start')
        .text(function(d) {
            return d.label;
        })
        .attr("x", 50)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            if (divId === '#bunching') {
                if (d.value.toFixed(1).length == 4) {
                    return x(d.value) + 52;
                } else {
                    return x(d.value) + 44;
                }
            } else if (divId === '#speed') {
                if (d.value.toFixed(1).length == 4) {
                    return x(d.value) + 70;
                } else {
                    return x(d.value) + 62;
                }
            } else {
                if (d.value.toString().length == 5) {
                    return x(d.value) + 55;
                } else if (d.value.toString().length == 4) {
                    return x(d.value) + 47;
                } else {
                    return x(d.value) + 39;
                }
            }
        });

    enterBars.append("text")
        .attr("class", "borough-ranking")
        .attr("x", '-30')
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return d.ranking;
        });

    // exit
    barChartGs.exit()
        .transition()
        .duration(500)
        .style('opacity', '0')
        .remove();

    var xAxisHeight = marginTopPlus30 + height;
    chart.select('.xaxisg')
        .attr("transform", "translate(" + margin.left + "," + xAxisHeight + ")")
        .transition()
        .duration(400)
        .call(xAxis);

    chart.select('.yaxisg')
        .attr("transform", "translate(" + margin.left + "," + marginTopPlus30 + ")")
        .transition()
        .duration(400)
        .call(yAxis);

}


app.updateNegativeBarChart = function(divId, data) {
    var arr = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (typeof data[i][key] === 'number') {
                arr.push(data[i][key]);
            }
        }
    }
    var margin = { top: 20, right: 70, bottom: 50, left: 80 };
    var marginTopPlus30 = margin.top + 30;
    var width;
    var checkWidth = $('.metric-component .chart-component').width() - margin.left - margin.right;
    if (checkWidth > 670) {
        width = 670;
    } else {
        width = checkWidth;
    }
    var barHeight = 25,
        barWidth = width * (3 / 4);
    var checkHeight = (barHeight * (data.length - 1)) - (margin.top - margin.bottom);
    if (checkHeight > 700) {
        if (app.districtName === 'citywide') {
            height = 3200;
        } else if (app.districtName === 'borough') {
            height = 1000;
        } else {
            height = 700;
        }
        barHeight = (height + (margin.top - margin.bottom)) / (data.length - 1);
    } else {
        height = checkHeight;
    }
    var totalHeight = height + margin.top;
    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, function(d, i) {
            return i * barHeight;
        })]);
    var x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) {
            return d.value;
        }))
        .range([60, width - 60]);
    var chart = d3.select(divId)
        .select('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var mainG = chart.select('.maing');

    var xAxis = d3.axisBottom(x);

    if (window.innerWidth > 425) {
        xAxis.ticks(5);
    } else {
        xAxis.ticks(2);
    }

    var yAxis = d3.axisLeft(y)
        .ticks(0);

    function type(d) {
        d.value = +d.value;
        return d;
    }

    var barChartGs = mainG.selectAll(".bars")
        .data(data)
        .attr("transform", function(d, i) {
            var traslateDown = (i * barHeight);
            return "translate(0," + traslateDown + ")";
        });

    // update
    barChartGs.select('rect')
        .attr("class", function(d) {
            if (d.label.search('Average') >= 0) {
                return 'bar-average-fill';
            } else {
                return "bar bar--" + (d.value < 0 ? "negative" : "positive");
            }
        })
        .attr("height", barHeight - 5)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return x(Math.min(0, d.value));
        })
        .attr("width", function(d, i) {
            return Math.abs(x(d.value) - x(0));
        });

    barChartGs.select(".bus-value-text")
        .attr('text-anchor', function(d) {
            return (d.value < 0 ? 'end' : 'start');
        })
        .text(function(d) {
            return d.value + '%';
        })
        .attr("y", (barHeight - 5) / 2)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return (d.value < 0 ? x(d.value) - 5 : x(d.value) + 5);
        });

    barChartGs.select(".bus-route")
        .attr("class", function(d) {
            if (d.label.search('Average') >= 0) {
                return 'bus-route bus-route-text-average';
            } else {
                return (d.value < 0 ? "bus-route bus-route-text-negative" : "bus-route bus-route-text");
            }
        })
        .attr('text-anchor', function(d) {
            return (d.value < 0 ? 'end' : 'start');
        })
        .text(function(d) {
            return d.label;
        })
        .attr("y", (barHeight - 5) / 2)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            if (d.value < 0) {
                if (d.value.toFixed(1).length == 5) {
                    return x(d.value) - 44;
                } else {
                    return x(d.value) - 36;
                }
            } else {
                if (d.value.toFixed(0).length == 3) {
                    return x(d.value) + 46;
                } else if (d.value.toFixed(0).length == 2) {
                    return x(d.value) + 38;
                } else {
                    return x(d.value) + 30;
                }
            }
        });

    barChartGs.select(".borough-ranking")
        .text(function(d) {
            return d.ranking;
        })
        .attr("y", (barHeight - 5) / 2);

    // enter
    var enterBars = barChartGs.enter().append("g")
        .classed('bars', true)
        .attr("transform", function(d, i) {
            var traslateDown = (i * barHeight);
            return "translate(0," + traslateDown + ")";
        });

    enterBars.append("rect")
        .attr("class", function(d) {
            if (d.label.search('Average') >= 0) {
                return 'bar-average-fill';
            } else {
                return "bar bar--" + (d.value < 0 ? "negative" : "positive");
            }
        })
        .attr("height", barHeight - 5)
        .attr("x", function(d) {
            return x(Math.min(0, d.value));
        })
        .attr("width", 0)
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("width", function(d, i) {
            return Math.abs(x(d.value) - x(0));
        });

    enterBars.append("text")
        .attr("class", "bus-value-text")
        .attr('text-anchor', function(d) {
            return (d.value < 0 ? 'end' : 'start');
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.value + '%';
        })
        .attr("x", function(d) {
            return (d.value < 0 ? x(0) - 5 : x(0) + 5);
        })
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            return (d.value < 0 ? x(d.value) - 5 : x(d.value) + 5);
        });



    enterBars.append("text")
        .attr("class", function(d) {
            if (d.label.search('Average') >= 0) {
                return 'bus-route bus-route-text-average';
            } else {
                return (d.value < 0 ? "bus-route bus-route-text-negative" : "bus-route bus-route-text");
            }
        })
        .attr('text-anchor', function(d) {
            return (d.value < 0 ? 'end' : 'start');
        })
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.label;
        })
        .attr("x", function(d) {
            return (d.value < 0 ? x(0) - 40 : x(0) + 30);
        })
        .transition()
        .duration(500)
        .delay(function(d, i) {
            return i * 25;
        })
        .attr("x", function(d) {
            if (d.value < 0) {
                if (d.value.toFixed(1).length == 5) {
                    return x(d.value) - 44;
                } else {
                    return x(d.value) - 36;
                }
            } else {
                if (d.value.toFixed(0).length == 3) {
                    return x(d.value) + 46;
                } else if (d.value.toFixed(0).length == 2) {
                    return x(d.value) + 38;
                } else {
                    return x(d.value) + 30;
                }
            }
        });

    enterBars.append("text")
        .attr("class", "borough-ranking")
        .attr("x", '-30')
        .attr("y", (barHeight - 5) / 2)
        .attr("dy", ".35em")
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return d.ranking;
        });

    // exit
    barChartGs.exit()
        .transition()
        .duration(500)
        .style('opacity', '0')
        .remove();

    var xAxisHeight = marginTopPlus30 + height;
    var yAxisLeft = margin.left + x(0);
    chart.select('.xaxisg')
        .attr("transform", "translate(" + margin.left + "," + xAxisHeight + ")")
        .transition()
        .duration(400)
        .call(xAxis);

    chart.select('.yaxisg')
        .attr("transform", "translate(" + yAxisLeft + "," + marginTopPlus30 + ")")
        .transition()
        .duration(400)
        .call(yAxis);

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
