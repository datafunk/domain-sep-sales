/*!
    Domain September 2014 Sales
    author: pborbely@fairfaxmedia.com.au | @datafunk
*/



var map;
var dataset;
// var market;
var suburbs = [];
var nodes = 0;
var colours = ['#ffffff', '#fc8d59', '#ffffdf', '#d9ef8b', '#91cf60', '#1a9850'];
var value_labels = ['N/A', 'decreased', '0', '1-10%', '11-25%', '+25%'];
var contentString = ''; // for infowindow

var array_pos = 0;

var span_col_1 = $('#data_col_1')[0]; // suburb
var span_col_2 = $('#data_col_2')[0]; // aud_house
var span_col_3 = $('#data_col_3')[0]; // pct_house
var span_col_4 = $('#data_col_4')[0]; // aud_unit
var span_col_5 = $('#data_col_5')[0]; // pct_unit



var isMobile = false;

if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPod|Opera Mini|IEMobile/i)) {
    isMobile = true;
    // dataset.city_zoom = dataset.city_zoom - 1;
}


// set data sources based on masthead domain
var data_collection = {
    "NSW": {
        "city": "Sydney",
        "state": "NSW",
        "city_lat": -33.86313718505916,
        "city_lng": 150.92789135742188,
        "city_zoom": 10,
        "city_zoom_min": 9,
        "city_zoom_max": 16,
        "data_src": "NSW-sales-sep2014.geojson"
    },
    "VIC": {
        "city": "Melbourne",
        "state": "VIC",
        "city_lat": -37.78983638820009,
        "city_lng": 145.11406384277345,
        "city_zoom": 9,
        "city_zoom_min": 8,
        "city_zoom_max": 16,
        "data_src": "VIC-sales-sep2014.geojson"
    },
    "QLD": {
        "city": "Brisbane",
        "state": "QLD",
        "city_lat": -27.574025344754826,
        "city_lng": 153.02264241796877,
        "city_zoom": 9,
        "city_zoom_min": 7,
        "city_zoom_max": 16,
        "data_src": "QLD-sales-sep2014.geojson"
    },
    "ACT": {
        "city": "Canberra",
        "state": "ACT",
        "city_lat": -35.306291255617595,
        "city_lng": 149.12270031738282,
        "city_zoom": 11,
        "city_zoom_min": 10,
        "city_zoom_max": 16,
        "data_src": "ACT-sales-sep2014_4.0.min.geojson"
    },
}

var app_domain = document.domain;
var brand = app_domain.replace(/\.com\.au/, '');
var brand = brand.replace(/www\.|dev\.|m\./, '');

switch (brand) {
    case 'smh':
        dataset = data_collection.NSW
        break;

    case 'theage':
        dataset = data_collection.VIC
        break;

    case 'canberratimes':
        dataset = data_collection.ACT
        break;

    case 'brisbanetimes':
        dataset = data_collection.QLD
        break;

    default:
        dataset = data_collection.NSW
        break;
}
// END set data source


var sales_data = {}

$.ajax({
    url: '/interactive/2014/domain-sep-sales/data/' + dataset.data_src,
    dataType: 'json',
    // localCache: false, // enable localStorage
    // forceCache: false, // force to make an ajax request and cache it
    cacheKey: 'domain-sep-sales', // the item name in the localStorage
    cacheTTL: 3000, // the cache live for how long in seconds, default is 60 sec
    error: function(e) {
        $('#form')[0].textContent = 'An error occurred and your data did not load';
        // console.error(e);
    },
    success: function(o) {
        sales_data = o;
        // google.maps.event.addListenerOnce(map, 'idle', function() {
        //     // //console.log('-- loaded --', nodes);
        //     pre_processData(sales_data);
        // });
        // validateGeoJson(sales_data);
        pre_processData(sales_data);
    }
});


/**********************/

function validateGeoJson(data) {

    console.log(data);

    function processSuccess(data) {
        if (data.status === 'ok') {
            alert('You just posted some valid GeoJSON!');
            pre_processData(data);

        } else if (data.status === 'error') {
            alert('There was a problem with your GeoJSON: ' + data.message);
        }
    }

    function processError() {
        alert('There was a problem with your ajax.');
    }

    $.ajax({
        url: 'http://geojsonlint.com/validate',
        type: 'POST',
        data: data,
        dataType: 'json',
        success: processSuccess,
        error: processError
    });

    // $.ajax({
    //     url: 'http://geojsonlint.com/validate',
    //     type: 'POST',
    //     data: bad_geojson,
    //     dataType: 'json',
    //     success: processSuccess,
    //     error: processError
    // });

}
/**********************/


function initialize() {

    // if (isMobile){
    //     dataset.city_zoom = dataset.city_zoom - 1;
    // }

    map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: dataset.city_zoom,
        center: {
            lat: dataset.city_lat,
            lng: dataset.city_lng
        },
        minZoom: dataset.city_zoom_min,
        maxZoom: dataset.city_zoom_max,
        scrollwheel: true,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        panControl: false,
        streetViewControl: false
    });

    var style = [{
        featureType: "all",
        elementType: 'all',
        stylers: [{
            saturation: -95
        }]
    }];

    var styledMapType = new google.maps.StyledMapType(style, {
        map: map,
        name: 'Styled Map'
    });

    map.mapTypes.set('map-style', styledMapType);
    map.setMapTypeId('map-style');

    console.log('---');


    // Load GeoJSON
    // argument allows selection as per 
    // map.data.getFeatureById('My Suburb Name')
    map.data.loadGeoJson('/interactive/2014/domain-sep-sales/data/' + dataset.data_src, {
        idPropertyName: 'SUBURB'
    });

    console.log('---');



    // var bounds = new google.maps.LatLngBounds();
    // var bounds = map.getBounds();
    // map.data.getBounds( function(feature){
    //     //console.log(feature);
    // });

    map.data.setStyle(function(feature) {

        nodes++;

        var color = 'white';
        var isClickable = true;
        var cursor_style = 'pointer';
        var fill_opacity = 0.75;

        var prime_key = parseFloat(feature.getProperty('PCT_HOUSE'));

        getMarketValue(prime_key);

        // //console.log([feature.getProperty('SUBURB'), 'prime_key is: ', prime_key, colours[array_pos] ]);

        return ({
            clickable: isClickable,
            cursor: cursor_style,
            fillColor: colours[array_pos],
            fillOpacity: fill_opacity,
            strokeColor: colours[array_pos],
            strokeWeight: 1,
        });
    });
    // END setStyle

    map.data.addListener('click', function(event) {
        map.data.revertStyle();
        map.data.overrideStyle(event.feature, {
            strokeWeight: 4,
            strokeColor: 'grey'
            // fillColor: 'red',
            // fillOpacity: 1
        });

        // //console.clear();
        // //console.log(event.feature.getProperty('SUBURB'));
        // //console.log(event.feature.getProperty('AUD_HOUSE'));
        // console.log(typeof(event.feature.getProperty('AUD_HOUSE')));


        // //console.log(event.feature.getProperty('PCT_HOUSE'));
        // //console.log(event.feature.getProperty('AUD_UNIT'));
        // //console.log(event.feature.getProperty('PCT_UNIT'));

        var suburb = event.feature.getProperty('SUBURB'); // col_1s
        var data_col_2 = parseInt(event.feature.getProperty('AUD_HOUSE'));
        var prime_key = parseFloat(event.feature.getProperty('PCT_HOUSE')); // col_3

        var data_col_4 = event.feature.getProperty('AUD_UNIT');
        var data_col_5 = event.feature.getProperty('PCT_UNIT');

        getMarketValue(prime_key);

        //console.log([event.latLng, event.latLng.lat()]);

        // infowindow.setPosition(event.latLng);
        // infowindow.setContent(event.feature.getProperty('SUBURB'));
        // infowindow.open(self.map);

        // var infoWindow = new google.maps.InfoWindow({
        //     content: event.feature.getProperty('SUBURB'),
        //     position: event.latLng,
        //     pixelOffset: new google.maps.Size(50, 50)
        // });
        // infoWindow.open(self.map);

        span_col_1.textContent = suburb;
        span_col_2.textContent = handleNoValue(data_col_2, '$');
        span_col_3.textContent = handleNoValue(prime_key, '%');
        span_col_4.textContent = handleNoValue(data_col_4, '$');
        span_col_5.textContent = handleNoValue(data_col_5, '%');

        $('#ur_sub').select2('val', suburb);
        ga(suburb);

        // $($('.intro')).fadeOut(400, function(){
        $($('.legend fieldset')[0]).fadeIn(400);
        // });


    });

    if (!isMobile) {
        map.data.addListener('mouseover', function(event) {

            // map.data.revertStyle();
            map.data.overrideStyle(event.feature, {
                strokeWeight: 4,
                strokeColor: 'white',
                fillOpacity: 0
            });
        });



        map.data.addListener('mouseout', function(event) {
            map.data.revertStyle();
        });

        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
    }



    makeLegend();

    // Remove custom styles.
    // map.data.setStyle({});

    // google.maps.event.addListenerOnce(map, 'idle', function() {
    //     //console.log('-- loaded --', nodes);
    // });

    $("#ur_sub").change(function(event) {
        my_suburb = $("#ur_sub")[0].value;
        my_suburb = my_suburb.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        ga(my_suburb);
        for (var i = 0; i < sales_data.features.length; i++) {
            if (sales_data.features[i].properties.SUBURB === my_suburb) {

                // //console.log(sales_data.features[i]);

                // var suburb = event.feature.getProperty('SUBURB'); // col_1
                var data_col_1 = parseFloat(sales_data.features[i].properties.SUBURB); // col_1
                var data_col_2 = parseFloat(sales_data.features[i].properties.AUD_HOUSE); // col_2
                var prime_key = parseFloat(sales_data.features[i].properties.PCT_HOUSE); // col_3
                var data_col_4 = parseFloat(sales_data.features[i].properties.AUD_UNIT); // col_4
                var data_col_5 = parseFloat(sales_data.features[i].properties.PCT_UNIT); // col_5



                getMarketValue(prime_key);

                // infowindow.setPosition(event.latLng);
                // infowindow.setContent(event.feature.getProperty('SUBURB'));
                // infowindow.open(self.map);

                span_col_1.textContent = my_suburb;
                span_col_2.textContent = handleNoValue(data_col_2, '$');
                span_col_3.textContent = handleNoValue(prime_key, '%');
                span_col_4.textContent = handleNoValue(data_col_4, '$');
                span_col_5.textContent = handleNoValue(data_col_5, '%');

                $($('.legend fieldset')[0]).fadeIn(400);

            }
        }
        document.activeElement.blur();

        // //console.log(map.data.getFeatureById(my_suburb));
        map.data.revertStyle();
        map.data.overrideStyle(map.data.getFeatureById(my_suburb), {
            strokeWeight: 4,
            strokeColor: 'red',
            fillOpacity: 0
        });


    });

    function ga(address) {

        if (address === '' || address === null) {
            address = document.getElementById('ur_sub').value;
        }

        if (address !== '') {
            var geocoder = new google.maps.Geocoder();
            // //console.log(address + ', ' + dataset.state + ', AU');
            geocoder.geocode({
                'address': address + ', ' + dataset.state + ', AU'
            }, function(sales_data, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    // // console.log(sales_data[0].geometry.bounds.toUrlValue());
                    map.fitBounds(sales_data[0].geometry.bounds);
                    map.setCenter(sales_data[0].geometry.center);
                } else {
                    //console.error("Sorry, we can't find that place using Google.");
                }
            });
        }
    }
}
// END initialize


function getMarketValue(prime_key) {

    if (isNaN(prime_key) || prime_key === null || prime_key === 'null') {
        array_pos = 0;
        //console.log(['prime_key is: ', prime_key, colours[array_pos]]);
    } else if (prime_key === 0) {
        array_pos = 2;
        //console.log(['prime_key is: ', prime_key, colours[array_pos]]);
    } else if (inRange(prime_key, -400.0, -0.00000000001)) {
        array_pos = 1;
        //console.log(['prime_key is: ', prime_key, colours[array_pos]]);
    } else if (inRange(prime_key, 0.00000001, 10.0)) {
        array_pos = 3;
        //console.log(['prime_key is: ', prime_key, colours[array_pos]]);
    } else if (inRange(prime_key, 10.01, 25.0)) {
        array_pos = 4;
        //console.log(['prime_key is: ', prime_key, colours[array_pos]]);
    } else if (inRange(prime_key, 25.01, 1000000.0)) {
        array_pos = 5;
        //console.log(['prime_key is: ', prime_key, colours[array_pos]]);
    }
    return array_pos
}
// return array_pos
// }

function handleNoValue(val, character) {

    var result = '';
    // //console.log(val, character);

    if (isNaN(val) || val === null) {
        val = 'N/A';
        character = '';
    }

    if (character === '$' && val !== 'N/A') {
        result = '$' + numberWithCommas(val);
    } else if (character = '%' && val !== 'N/A') {
        result = val + '%';
    } else {
        result = val;
    }

    return result
}

function pre_processData(sales_data) {

    // localStorage.setItem('sales_data', JSON.stringify(sales_data));
    // // Retrieve the object from storage
    // var retrievedObject = localStorage.getItem('sales_data');
    // //console.log('retrievedObject: ', JSON.parse(retrievedObject));

    for (var i in sales_data.features) {
        // suburbs list
        var subOpt = document.createElement('option');
        subOpt.setAttribute('value', sales_data.features[i].properties.SUBURB);
        subOpt.text = sales_data.features[i].properties.SUBURB;
        $("#ur_sub")[0].appendChild(subOpt);

        // market value_labels
        var prime_key = parseFloat(sales_data.features[i].properties.prime_key);
        getMarketValue(prime_key);
        // sales_data.features[i].properties['market'] = value_labels[array_pos];
        // sales_data.features[i].properties.market = value_labels[array_pos];
    }


    if (navigator.userAgent.indexOf('MSIE') !== -1 || $('body').hasClass('ie')) {
        // //console.log('IE');
        $("#form").css('background-image', 'none');
        // $("#form").css('height', '0px');
        $("#form").css('margin', '0');
        // $('#form').textContent('Error occured, IE reports out of memory operations.');
    } else {
        if ($("#ur_sub")[0].children.length > sales_data.features.length) {
            // //console.log('not IE');
            // //console.log('activating dropdown');
            $("#form").css('background-image', 'none');
            $("select#ur_sub").fadeIn();
            $("#ur_sub").select2();
            $('fieldset#legend').fadeIn();
        }
    }
}


function inRange(x, min, max) {
    return x >= min && x <= max;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function makeLegend() {
    var keyDiv = document.getElementById('keys2map');
    for (var i in colours) {
        var mapKeySpan = document.createElement('td');
        mapKeySpan.setAttribute('class', 'mapKey');
        mapKeySpan.setAttribute('style', 'background-color:' + colours[i]);
        mapKeySpan.textContent = value_labels[i];
        keyDiv.appendChild(mapKeySpan);
    }
}

google.maps.event.addDomListener(window, 'load', initialize);



// comes from this repository: github.com/paulirish/jquery-ajax-localstorage-cache
$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    // Cache it ?
    if (!window.localStorage || !options.localCache)
        return;

    // cache ttl in seconds
    var ttl = options.cacheTTL || 60,
        cached = localStorage.getItem(options.cacheKey);

    if (!options.forceCache) {
        if (cached) {
            cached = JSON.parse(cached);
            // if cache expired
            if (cached.ttl < +new Date()) {
                localStorage.removeItem(options.cacheKey);
            } else {
                options.success(cached.cache);
                // Abort is broken on JQ 1.5 :(
                jqXHR.abort();
                return;
            }
        }
    }

    // start the request
    //If it not in the cache, we change the success callback, just put data on localstorage and after that apply the initial callback
    if (options.success) {
        options.realsuccess = options.success;
    }

    options.success = function(data) {
        var strdata = data,
            cache = {
                ttl: +new Date() + 1000 * ttl,
                cache: data
            };
        if (options.dataType.indexOf('json') === 0)
            strdata = JSON.stringify(cache);

        // Save the data to localStorage catching exceptions (possibly QUOTA_EXCEEDED_ERR)
        try {
            localStorage.setItem(options.cacheKey, strdata);
        } catch (e) {
            // Remove any incomplete data that may have been saved before the exception was caught
            localStorage.removeItem(options.cacheKey);
            if (options.cacheError)
                options.cacheError(e, options.cacheKey, strdata);
        }

        if (options.realsuccess)
            options.realsuccess(data);
    }
})
