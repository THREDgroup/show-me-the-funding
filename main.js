// Example string: https://api.nsf.gov/services/v1/awards.xml?agency=NSF&fundProgramName=%22ECI+Engineering+for+Civil%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset=150
let all_data = [];
let offset = 1;
let CORS_anywhere = "https://cors-anywhere.herokuapp.com/";

// $(function () {
//     $("#slider-range").slider({
//         range: true,
//         min: 1990,
//         max: 2020,
//         step: 1,
//         values: [2015, 2020],
//         slide: function (event, ui) {
//             $("#amount").val(ui.values[0] + " - " + ui.values[1]);
//         }
//     });
//     $("#amount").val($("#slider-range").slider("values", 0) +
//         " - " + $("#slider-range").slider("values", 1));
// });

$("#submit").on('click', function(event) {
    $("#results_description").html("");
    $("#results").html("");
    $("#submit").addClass('disabled');
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
                format_data(all_data, 0, 5000);
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

function format_data(json, lower_year, upper_year) {
    console.log(lower_year);
    console.log(upper_year);

    let money = [];
    let years = []
    console.log(json);
    for (let i = 0; i < json.length; i++) {
        let startYear = parseInt(json[i].startDate.slice(-4));
        if (startYear >= lower_year && startYear <= upper_year) {
            console.log(startYear);
            money.push(json[i].fundsObligatedAmt);
            years.push(startYear);
        }
    }

    console.log(years)

    $("#results_description").html("Between the years of " + Math.min(...years) + " and " + Math.max(...years) + ", the <b>" + $("#exampleFormControlSelect1").val() + "</b> program had a median funding level of $" + percentile(money, 0.5) + ", with 25th and 75th percentiles of $" + percentile(money, 0.25) + " and $" + percentile(money, 0.75) + ", respectively.")

    let trace = {
        x: money,
        type: 'histogram',
        xbins: {size: 100000},
    };
    let data = [trace];
    Plotly.newPlot('money_histogram', data);


    let trace2 = {
        x: years,
        type: 'histogram',
        xbins: {size: 1},
    };
    let data2 = [trace2];
    Plotly.newPlot('time_histogram', data2, {yaxis: {title: {text: "Year"}}, xaxis: {title: {text: "Count"}, tick0: Math.min(...years), dtick: 1.0}});
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


// let lower_year = $("#slider-range").slider("values", 0);
// let upper_year = $("#slider-range").slider("values", 1);
