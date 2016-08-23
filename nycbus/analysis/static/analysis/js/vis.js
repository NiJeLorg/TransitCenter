/*!
 * vis.js: Creates CARTO Deep Insights Dashboard 
 */

function app() {}

app.init = function () {


    //app.username = app.diJSON.match(/\/u\/(.+)\/api\/v\d\/|:\/\/(.+)\.cartodb\.com\/api/i)[1];
    app.username = 'busworks';

    // SQL client, inf needed
    app.sqlclient = new cartodb.SQL({
        user: app.username,
        protocol: "https",
        sql_api_template: "https://{user}.cartodb.com:443"
    });

    // pull users maps
    app.getVisSettings();

    // set up listeners
    app.setUpListeners();

}

app.getVisSettings = function () {
    $.ajax({
        type: "GET",
        url: "/getVisSettings/",
        success: function(data){
            console.log(data);
            if ($.isEmptyObject(data)) {
                // add default vis.json
                var randomInt = Math.floor(Math.random() * (4 - 0 + 1)) + 0;
                app.diJSON = app.selectVis(randomInt);
                app.update();
            } else {
                console.log('import');
            }
        }
    });
}

app.selectVis = function (num) {
    var diJSON = [];
    // the URLs to CARTO viz.json

    // On Time Performance
    diJSON.push('https://transitcenter.carto.com/u/busworks/api/v3/viz/a13376f4-6919-11e6-a7ba-0ecd1babdde5/viz.json');

    //Wait Time Probability by Route
    diJSON.push('https://transitcenter.carto.com/u/busworks/api/v3/viz/ed841028-6913-11e6-8675-0e05a8b3e3d7/viz.json');

    // Service Metrics by Route
    diJSON.push('https://transitcenter.carto.com/u/busworks/api/v3/viz/ed435cc0-690b-11e6-80b0-0e3ff518bd15/viz.json');

    // Service Metrics by Stop
    diJSON.push('https://transitcenter.carto.com/u/busworks/api/v3/viz/60de9a2a-68fb-11e6-bd1e-0e3ebc282e83/viz.json');    

    // Excess Wait Time by Route
    diJSON.push('https://transitcenter.carto.com/u/busworks/api/v3/viz/965d1690-68d3-11e6-ae21-0e233c30368f/viz.json');

    // Excess Wait Time by Stop
    diJSON.push('https://transitcenter.carto.com/u/busworks/api/v3/viz/7ad40b46-68eb-11e6-949f-0ecd1babdde5/viz.json');

    return diJSON[num];

}

app.update = function () {

    cartodb.deepInsights.createDashboard('#dashboard', app.diJSON, {
        no_cdn: false
    }, function (err, dashboard) {

        app.dashboard = dashboard;

        // DI map
        app.map = app.dashboard.getMap();

        //set view based on loaded project if one exists
        var latlng = L.latLng(50.5, 30.5);
        //app.map.map.setView(latlng, 4);

        // CartoDB layers
        app.layers = app.map.getLayers();

        // Array of widgets views
        app.widgets = dashboard.getWidgets();

        // Array of widgets’ data models
        app.widgetsdata = app.widgets.map(function (a) {
            return a.dataviewModel
        });

    });


    /**** WAITING FOR: It may be possible to save widget selections in the future, but not at the moment ****/
    //app.widgets[1].update({ title: 'testing title', normalized: true });

}


app.setUpListeners = function () {
    $('.visMenu').click(function() {
        // remove previous dashboard
        $('#dashboard').remove();
        // create new empty dahsboard
        $('<div id="dashboard"></div>').appendTo("#dashWrapper");
        var visNum = $(this).data("vis");
        app.diJSON = app.selectVis(visNum);
        app.update();
    });

    // listen for modal opening and pull correct form
    /**** TODO: Debug conflict between Deep Insights and Bootstrap ****/
    $('#tcProjectModal').on('show.bs.modal', function (event) {
        console.log('hello');
        var button = $(event.relatedTarget); // Button that triggered the modal
        var type = button.data('type'); // Extract info from data-* attributes
        var url = '';
        if (type == 'New Project') {
            var url = "/getVisSettings/";
        }

        // run the ajax
        $.ajax({
            type: "GET",
            url: url,
            success: function(data){
                console.log(data);
                console.log(type);
                $('#tcProjectModalLabel').text(type);

            }
        });      


    });
}


