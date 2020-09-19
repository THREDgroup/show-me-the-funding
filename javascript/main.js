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
        piLastName: undefined,
        eager: undefined,
        goali: undefined,
        collab: undefined,
        rapid: undefined,
        career: undefined
    }
];

let consolidated_data = all_data;

let offset = 1;
let CORS_anywhere = "https://cors-anywhere.herokuapp.com/";
let spinner = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>  ';

// Plotly
let configuration = {
    responsive: true,
    scrollZoom: false,
    displayModeBar: true
};

$(function () {
    let min_handle = $("#custom-handle-min");
    let max_handle = $("#custom-handle-max");
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
    $("#money_time_histogram").html("");
    $("#type_histogram").html("");
    $("#data_table").html("");
    $("#slider-range").hide();
    $("#collab-toggle").hide();

    // Reset hte data
    all_data = [];
    offset = 1;
}

$("#submit").on('click', function (event) {
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
        url: CORS_anywhere + "https://api.nsf.gov/services/v1/awards.json?agency=NSF&fundProgramName=%22" + program_string.split(" ").join("+") + "%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset=" + offset,
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

function supplement_data() {
    for (let i = 0; i < all_data.length; i++) {
        all_data[i].startYear = parseInt(all_data[i].startDate.slice(-4));
        all_data[i].eager = 1*all_data[i].title.includes("EAGER:");
        all_data[i].goali = 1*all_data[i].title.includes("GOALI:");
        all_data[i].rapid = 1*all_data[i].title.includes("RAPID:");
        all_data[i].career = 1*all_data[i].title.includes("CAREER:");
        all_data[i].collab = 1*all_data[i].title.includes("Collaborative Research:");
    }
}

function initial_parse(program_string) {
    console.log(sum_array(all_data.map(a=>parseInt(a.fundsObligatedAmt))));
    supplement_data();
    consolidate_collaborative_research();
    console.log(sum_array(all_data.map(a=>parseInt(a.fundsObligatedAmt))));

    let years = all_data.map(a => a.startYear);

    let min_time = Math.min(...years);
    let max_time = Math.max(...years);

    // Activate tab adn make summary
    make_summary(min_time, max_time, program_string);
    $("#summary-tab").removeClass("disabled");

    // Another tab
    make_time_histogram(years);
    make_money_time_histogram(years);
    $("#program-size-tab").removeClass("disabled");

    // Another tab
    update_slider(min_time, max_time);
    make_funding_histogram(min_time, max_time);
    $("#collab-toggle").show();
    $("#award-size-tab").removeClass("disabled");

    // Another tab
    make_type_histogram(years);
    $("#award-type-tab").removeClass("disabled");

    // Another one - DJ Khaled
    make_data_table();
    $("#data-tab").removeClass("disabled");

}

function update_slider(min_time, max_time) {
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

    let layout = {
        yaxis: {title: {text: "Count"}},
        xaxis: {title: {text: "Year"}, tick0: Math.min(...years), dtick: 1.0}
    };

    Plotly.newPlot('time_histogram', data2, layout, configuration);

}

function make_summary(min_time, max_time, program_string) {
    let money = get_money(all_data, min_time, max_time);

    let p50 = percentile(money, 0.5);
    let p25 = percentile(money, 0.25);
    let p75 = percentile(money, 0.75);
    let n = money.length;

    let html_string = "<p>Between the years of " + min_time + " and " + max_time + ", the <b>" + program_string + "</b> program funded " + n + " projects, including the following types:</p>" +        "<ul>" +
        "<li> GOALI: " + sum_array(all_data.map(a => a.goali)) + "</li>" +
        "<li> EAGER: " + sum_array(all_data.map(a => a.eager)) + "</li>" +
        "<li> RAPID: " + sum_array(all_data.map(a => a.rapid)) + "</li>" +
        "<li> CAREER: " + sum_array(all_data.map(a => a.career)) + "</li>" +
        "<li> Collaborative research: " + sum_array(all_data.map(a => a.collab)) + "</li>" +
        "</ul>" +
        "<p>For these projects, there was a median funding level of $" + p50 + ", with 25th and 75th percentiles of $" + p25 + " and $" + p75 + ", respectively."
    $("#results_description").html(html_string);
}

function get_money(data, min_time, max_time) {
    return data.filter(function (e) {
        return e.startYear >= min_time && e.startYear <= max_time;
    }).map(a => a.fundsObligatedAmt);
}


function make_funding_histogram(min_time, max_time) {

    let the_good_data = [];
    if ($("#separate-awards-label").hasClass('active')) {
        console.log("using all data", all_data.length);
        the_good_data = all_data
    } else {
        console.log("using consolidated data", consolidated_data.length);
        the_good_data = consolidated_data;
    }
    let money = get_money(the_good_data, min_time, max_time);
    console.log(money);

    let trace = {
        x: money,
        type: 'histogram',
        xbins: {size: 100000},
    };
    let data = [trace];

    let layout = {yaxis: {title: {text: "Number of Awards"}}, xaxis: {title: {text: "Funding"}}};

    Plotly.newPlot('money_histogram', data, layout, configuration);
}


function make_money_time_histogram(years) {

    let money = get_money(all_data, Math.min(...years), Math.max(...years))

    let trace2 = {
        histfunc: "sum",
        x: years,
        y: money,
        type: 'histogram',
        xbins: {size: 1},
    };
    let data2 = [trace2];

    let layout = {
        yaxis: {title: {text: "Total Funding Obligated"}},
        xaxis: {title: {text: "Year"}, tick0: Math.min(...years), dtick: 1.0}
    };

    Plotly.newPlot('money_time_histogram', data2, layout, configuration);

}


function make_type_histogram(years) {

    let data = [
        {
            histfunc: "sum",
            x: years,
            y: all_data.map(a => a.eager),
            type: 'histogram',
            xbins: {size: 1},
            name: "EAGER"
        },
        {
            histfunc: "sum",
            x: years,
            y: all_data.map(a => a.career),
            type: 'histogram',
            xbins: {size: 1},
            name: "CAREER"
        },
        {
            histfunc: "sum",
            x: years,
            y: all_data.map(a => a.goali),
            type: 'histogram',
            xbins: {size: 1},
            name: "GOALI"
        },
        {
            histfunc: "sum",
            x: years,
            y: all_data.map(a => a.rapid),
            type: 'histogram',
            xbins: {size: 1},
            name: "RAPID"
        }];

    let layout = {
        yaxis: {title: {text: "Number of Awards"}},
        xaxis: {title: {text: "Year"}, tick0: Math.min(...years), dtick: 1.0}
    };

    Plotly.newPlot('type_histogram', data, layout, configuration);

}


function consolidate_collaborative_research() {
    let all_data_clone = JSON.parse(JSON.stringify(all_data));


    // Start fresh
    consolidated_data = all_data_clone.filter(function(e) {
        if (!e.collab) {
            return e;
        }
    });

    // Unfortunately this probably needs a for loop
    let collab_data = all_data_clone.filter(function(e) {
        if (e.collab) {
            return e;
        }
    });

    // Sort the damn thing
    collab_data.sort(function(a, b) {
        if (a.title > b.title) return 1;
        if (b.title > a.title) return -1;
        return 0;
    });

    for (let i=0; i<(collab_data.length-1); i++) {
        let end_of_consol= consolidated_data.length-1
        if (collab_data[i].title === consolidated_data[end_of_consol].title) {
            let current = parseInt(consolidated_data[end_of_consol].fundsObligatedAmt);
            let newnew = parseInt(collab_data[i].fundsObligatedAmt);
            consolidated_data[end_of_consol].fundsObligatedAmt = (current + newnew).toString();
            console.log(current, newnew, consolidated_data[end_of_consol].fundsObligatedAmt);
        } else {
            consolidated_data = consolidated_data.concat([collab_data[i]]);
        }
    }
}

$("#separate-awards").on('click', update_money_histogram);
$("#consolidate-awards").on('click', update_money_histogram);


function update_money_histogram() {
    let range = $("#slider-range").slider("values");

    make_funding_histogram(parseInt(range[0]), parseInt(range[1]));
}

function make_data_table() {
    let table = $("#data_table");
    let table_content = "<table class='table'><thead class='thead-light'><tr><th>Title</th><th>Start</th><th>End</th><th>Funding</th><th>Link</th></tr></thead>";
    let keys = ["title", "startDate", "expDate"];
    all_data.forEach(function(award, index) {
        table_content += "<tr>";
        keys.forEach(function(key, index) {
            table_content += ("<td>" + award[key] + "</td>");
        });
        table_content += ("<td>$" + numberWithCommas(award.fundsObligatedAmt) + "</td>")
        let url = "https://www.nsf.gov/awardsearch/showAward?AWD_ID=" + award.id;
        table_content += ("<td><a href='" + url + "' target='_blank'>" + url + "</a></td>");
        table_content += "</tr>";
    });

        // eager: undefined,
        // goali: undefined,
        // collab: undefined,
        // rapid: undefined,
        // career: undefined

    table_content += "</table>";

    table.html(table_content);
}

