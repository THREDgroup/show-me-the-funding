// Example string: https://api.nsf.gov/services/v1/awards.xml?agency=NSF&fundProgramName=%22ECI+Engineering+for+Civil%22&printFields=id,title,fundsObligatedAmt,piFirstName,piLastName,startDate,expDate&offset=150

$( function() {
    $( "#slider-range" ).slider({
      range: true,
      min: 1990,
      max: 2020,
      step: 1,
      values: [ 2015, 2020 ],
      slide: function( event, ui ) {
        $( "#amount" ).val(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
      }
    });
    $( "#amount" ).val( $( "#slider-range" ).slider( "values", 0 ) +
      " - " + $( "#slider-range" ).slider( "values", 1 ) );
  } );