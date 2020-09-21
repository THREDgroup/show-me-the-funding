
$("#verify").on('click', function(event) {
    let program_string = $("#freetext-program").val().split(" ").join("+");
    $(this).html(spinner + "Verifying...")
    verify_program_string(program_string, this);
})

function verify_program_string(program_string, this_button) {
    $.ajax({
        url: "https://api.nsf.gov/services/v1/awards.json?agency=NSF&fundProgramName=%22" + program_string + "%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset="+offset,
        type: "GET",
        dataType: 'jsonp',
        success: function (response) {
            $(this_button).html("Verify and Load");
            if (response.response.award.length === 0) {
                verify_failure(program_string);
            } else {
                verify_success(program_string, response.response.award[0])
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
    $("#verification-modal-success").modal('show');

}

function verify_failure(program_string) {
    let body = $("#verify-modal-failure-body");
    body.html("<p>When I tried to search for <b>" + program_string + "</b> I couldn't find any results. Sorry!")
    $("#verification-modal-failure").modal('show');
}

$("#verify-looks-good").on('click', function() {
    let program_string = $("#freetext-program").val();
    prepare_for_load();

    let submit = $("#verify");
    submit.addClass('disabled');
    submit.html(spinner + "Loading records...")

    get_data(program_string, submit, "Verify and Load");
});
