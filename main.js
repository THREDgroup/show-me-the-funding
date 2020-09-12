// Example string: https://api.nsf.gov/services/v1/awards.xml?agency=NSF&fundProgramName=%22ECI+Engineering+for+Civil%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset=150
let all_data = [];
let offset = 1;
let CORS_anywhere = "https://cors-anywhere.herokuapp.com/";
let spinner = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>  ';
let checkmark = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path style="fill:white;" d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg>';
let crossout = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path style="fill:white;" d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg>';

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

$("#submit").on('click', function(event) {
    // Hide everything
    $("#results_description").html("");
    $("#money_histogram").html("");
    $("#time_histogram").html("");
    $("#slider-range").hide()

    // Disable hte button
    let submit = $("#submit");
    submit.addClass('disabled');
    submit.html(spinner + "Loading records...")

    // Reset hte data
    all_data = [];
    offset = 1;

    // Start the search
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
                initial_parse(all_data);
            } else {
                console.log(all_data);
                all_data = all_data.concat(response.response.award);
                offset += 25;
                $("#submit").html(spinner + all_data.length + " records loaded");
                get_data(program_string);
            }
        }
    });
}

function initial_parse() {

    for (let i = 0; i < all_data.length; i++) {
        all_data[i].startYear = parseInt(all_data[i].startDate.slice(-4));
    }

    let years = all_data.map(a => a.startYear);

    let min_time = Math.min(...years);
    let max_time = Math.max(...years);

    update_slider(min_time, max_time);
    make_summary(min_time, max_time);
    make_funding_histogram(min_time, max_time);
    make_time_histogram(years);

}

function update_slider(min_time, max_time){
    $("#custom-handle-min").text(min_time);
    $("#custom-handle-max").text(max_time);
    $("#slider-range").slider("option", {min: min_time, max: max_time, values: [min_time, max_time]});
    $("#slider-range").show();
}

function make_time_histogram(years) {
    let trace2 = {
        x: years,
        type: 'histogram',
        xbins: {size: 1},
    };
    let data2 = [trace2];

    let layout = {yaxis: {title: {text: "Count"}}, xaxis: {title: {text: "Year"}, tick0: Math.min(...years), dtick: 1.0}};

    let configuration = {responsive: true};
    Plotly.newPlot('time_histogram', data2, layout, configuration);

}

function make_summary(min_time, max_time) {
    let money = get_money(min_time, max_time);

    let p50 = percentile(money, 0.5);
    let p25 = percentile(money, 0.25);
    let p75 = percentile(money, 0.75);
    let n = money.length;


    $("#results_description").html("<p>Between the years of " + min_time + " and " + max_time + ", the <b>" + $("#exampleFormControlSelect1").val() + "</b> program funded " + n + " projects.</p> <p>For these projects, there was a median funding level of $" + p50 + ", with 25th and 75th percentiles of $" + p25 + " and $" + p75 + ", respectively.")
}
function get_money(min_time, max_time) {
    return all_data.filter(function(e) {
        return e.startYear >= min_time && e.startYear <= max_time;
    }).map(a => a.fundsObligatedAmt);
}


function make_funding_histogram(min_time, max_time) {

    let money = get_money(min_time, max_time);

    // $("#results_description").html("Between the years of " + min_time + " and " + max_time + ", the <b>" + $("#exampleFormControlSelect1").val() + "</b> program had a median funding level of $" + percentile(money, 0.5) + ", with 25th and 75th percentiles of $" + percentile(money, 0.25) + " and $" + percentile(money, 0.75) + ", respectively.")

    let trace = {
        x: money,
        type: 'histogram',
        xbins: {size: 100000},
    };
    let data = [trace];

    let layout = {yaxis: {title: {text: "Number of Awards"}}, xaxis: {title: {text: "Funding"}}};

    let configuration = {responsive: true};

    Plotly.newPlot('money_histogram', data, layout, configuration);
}











$("#verify").on('click', function(event) {
    let program_string = $("#freetext-program").val();
    verify_program_string(program_string);
})

function verify_program_string(program_string) {
    $.ajax({
        url: CORS_anywhere + "https://api.nsf.gov/services/v1/awards.json?agency=NSF&fundProgramName=%22" + program_string + "%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset="+offset,
        type: "GET",
        crossDomain: true,
        success: function (response) {
            if (response.response.award.length === 0) {
                $("#verification-modal").modal('show');
            } else {
                verify_success(program_string, response.response.award[0])
                let verify = $("#verify");
                verify.removeClass('btn-primary').addClass("btn-success").addClass("disabled");
                verify.html(checkmark)
                $("#submit-custom").removeClass("btn-secondary").removeClass("disabled").addClass("btn-primary");

                $("#verification-modal").modal('show');
            }
        }
    });
}

function verify_success(program_string, award) {
    let body = $("#verify-modal-body");
    body.html("<p>Here's the first result that I found when I searched for <b>" + program_string + "</b>. Does it look right?</p>" +
        "<ul>" +
        "<li>" + award.title +"</li>" +
        "<li>PI " + award.piFirstName + " " + award.piLastName + "</li>" +
        "<li>" + award.startDate + " - " + award.expDate + "</li>" +
        "</ul>" +
        "<p>You can find more information about the award <a href=\"https://www.nsf.gov/awardsearch/showAward?AWD_ID=" + award.id + "\" target=\"_blank\">here</a>.</p>");
}

function verify_failure(program_string) {

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
