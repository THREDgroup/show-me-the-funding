// Example string: https://api.nsf.gov/services/v1/awards.xml?agency=NSF&fundProgramName=%22ECI+Engineering+for+Civil%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset=150
let all_data = [
    {
        id: undefined,
        title: undefined,
        fundsObligatedAmt: undefined,
        startDate: undefined,
        expDate: undefined,
        startYear: undefined,
        piFirstName: undefined,
        piLastName: undefined
    }
];

let offset = 1;
let CORS_anywhere = "https://cors-anywhere.herokuapp.com/";
let spinner = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>  ';

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

function prepare_for_load() {
    // Hide everything
    $("#results_description").html("");
    $("#money_histogram").html("");
    $("#time_histogram").html("");
    $("#slider-range").hide()

    // Reset hte data
    all_data = [];
    offset = 1;
}

$("#submit").on('click', function(event) {
    // Hide everything
    prepare_for_load();

    let submit = $("#submit");
    submit.addClass('disabled');
    submit.html(spinner + "Loading records...")

    // Start the search
    let program_string = $("#exampleFormControlSelect1").val();
    get_data(program_string, submit, "Load Data");
})

function get_data(program_string, this_button, reset) {
    $.ajax({
        url: CORS_anywhere + "https://api.nsf.gov/services/v1/awards.json?agency=NSF&fundProgramName=%22" + program_string.split(" ").join("+") + "%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset="+offset,
        type: "GET",
        crossDomain: true,
        success: function (response) {
            all_data = all_data.concat(response.response.award);
            this_button.html(spinner + all_data.length + " records loaded");
            if (response.response.award.length < 25) {
                this_button.removeClass('disabled');
                this_button.html(reset);
                initial_parse(program_string);
            } else {
                offset += 25;
                get_data(program_string, this_button, reset);
            }
        }
    });
}

function initial_parse(program_string) {

    for (let i = 0; i < all_data.length; i++) {
        all_data[i].startYear = parseInt(all_data[i].startDate.slice(-4));
    }

    let years = all_data.map(a => a.startYear);

    let min_time = Math.min(...years);
    let max_time = Math.max(...years);

    update_slider(min_time, max_time);
    make_summary(min_time, max_time, program_string);
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

function make_summary(min_time, max_time, program_string) {
    let money = get_money(min_time, max_time);

    let p50 = percentile(money, 0.5);
    let p25 = percentile(money, 0.25);
    let p75 = percentile(money, 0.75);
    let n = money.length;


    $("#results_description").html("<p>Between the years of " + min_time + " and " + max_time + ", the <b>" + program_string + "</b> program funded " + n + " projects.</p> <p>For these projects, there was a median funding level of $" + p50 + ", with 25th and 75th percentiles of $" + p25 + " and $" + p75 + ", respectively.")
}
function get_money(min_time, max_time) {
    return all_data.filter(function(e) {
        return e.startYear >= min_time && e.startYear <= max_time;
    }).map(a => a.fundsObligatedAmt);
}


function make_funding_histogram(min_time, max_time) {

    let money = get_money(min_time, max_time);

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












