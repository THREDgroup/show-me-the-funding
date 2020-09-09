// Example string: https://api.nsf.gov/services/v1/awards.xml?agency=NSF&fundProgramName=%22ECI+Engineering+for+Civil%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset=150
let all_data = [];
let offset = 1;
let CORS_anywhere = "https://cors-anywhere.herokuapp.com/";

$(function () {
    let min_handle = $( "#custom-handle-min" );
    let max_handle = $( "#custom-handle-max" );
    $("#slider-range").slider({
        range: true,
        min: 1990,
        max: 2020,
        step: 1,
        values: [2015, 2020],
        slide: function (event, ui) {
            min_handle.text(ui.values[0])
            max_handle.text(ui.values[1])
            make_funding_histogram(ui.values[0], ui.values[1]);
        },
        create: function (event, ui) {
            min_handle.text($(this).slider("values")[0])
            max_handle.text($(this).slider("values")[1])
            $("#slider-range").hide();
        }
    });
});

function clear_results() {
    $("#results_description").html("");
    $("#results").html("");
}

$("#submit").on('click', function(event) {
    $("#submit").addClass('disabled');
    $("#submit").html("Loading records...")
    clear_results();
    all_data = [];
    offset = 1;
    let program_string = $("#exampleFormControlSelect1").val().split(" ").join("+");
    get_data(program_string);
})

function get_data(program_string) {
    $.ajax({
        url: CORS_anywhere + "https://api.nsf.gov/services/v1/awards.json?agency=NSF&fundProgramName=%22" + program_string + "%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset="+offset,
        type: "GET",
        crossDomain: true,
        success: function (response) {
            if (response.response.award.length === 0) {
                $("#submit").removeClass('disabled');
                $("#submit").html("Load Data");
                update_slider(all_data);
            } else {
                console.log(all_data);
                all_data = all_data.concat(response.response.award);
                offset += 25;
                $("#submit").html(all_data.length + " records loaded");
                get_data(program_string);
            }
        }
    });
}

function update_slider() {

    for (let i = 0; i < all_data.length; i++) {
        all_data[i].startYear = parseInt(all_data[i].startDate.slice(-4));
    }

    let years = all_data.map(a => a.startYear);

    let min_time = Math.min(...years);
    let max_time = Math.max(...years);

    $("#custom-handle-min").text(min_time);
    $("#custom-handle-max").text(max_time);
    $("#slider-range").slider("option", {min: min_time, max: max_time, values: [min_time, max_time]});


    make_funding_histogram(min_time, max_time);
    make_time_histogram(years);

    $("#slider-range").show();
}

function make_time_histogram(years) {
    let trace2 = {
        x: years,
        type: 'histogram',
        xbins: {size: 1},
    };
    let data2 = [trace2];
    Plotly.newPlot('time_histogram', data2, {yaxis: {title: {text: "Count"}}, xaxis: {title: {text: "Year"}, tick0: Math.min(...years), dtick: 1.0}});
}


function make_funding_histogram(min_time, max_time) {

    let money = all_data.filter(function(e) {
        return e.startYear >= min_time && e.startYear <= max_time;
    }).map(a => a.fundsObligatedAmt);

    $("#results_description").html("Between the years of " + min_time + " and " + max_time + ", the <b>" + $("#exampleFormControlSelect1").val() + "</b> program had a median funding level of $" + percentile(money, 0.5) + ", with 25th and 75th percentiles of $" + percentile(money, 0.25) + " and $" + percentile(money, 0.75) + ", respectively.")

    let trace = {
        x: money,
        type: 'histogram',
        xbins: {size: 100000},
    };
    let data = [trace];
    Plotly.newPlot('money_histogram', data, {yaxis: {title: {text: "Count"}}, xaxis: {title: {text: "Funding"}}});
}

function percentile(arr, p) {
    if (arr.length === 0) return 0;
    if (typeof p !== 'number') throw new TypeError('p must be a number');
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    arr.sort(function (a, b) { return a - b; });
    var index = (arr.length - 1) * p
    lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
}
