$(document).ready(function(){
    homeView();
    $('.p-home').on('tap', renderHomeView);
    $('.p-scan').on('tap', renderScanView);
    $('.p-about').on('tap', renderAboutView);

    $('[data-role=footer]').addClass("ui-footer ui-bar-a");
    $('[data-role=navbar]').addClass("ui-navbar ui-mini");

});

// --- Render views
//
function renderHomeView(event) {
    homeView();
}

function renderScanView(event) {
    scanView();
}

function renderAboutView(event) {
    aboutView();
}


// --- Views
//
function homeView(event) {
    // active state for navbar
    $('#home .p-home, #home .p-scan, #home .p-about').removeClass("ui-btn-active");
    $('#home .p-home').addClass("ui-btn-active");
}

function scanView(event) {
    // active state for navbar
    $('#scan .p-home, #scan .p-scan, #scan .p-about').removeClass("ui-btn-active");
    $('#scan .p-scan').addClass("ui-btn-active");
}

function aboutView(event) {
    // active state for navbar
    $('#about .p-home, #about .p-scan, #about .p-about').removeClass("ui-btn-active");
    $('#about .p-about').addClass("ui-btn-active");
}




// --- Others
//
function showNotification(message , title){
    if (navigator.notification) {
        navigator.notification.alert(message, null, title, 'OK');
    } else {
        alert(title ? (title + ": " + message) : message);
    }
}

function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'unknown';
    // states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi';
    states[Connection.CELL_2G]  = '2G';
    states[Connection.CELL_3G]  = '3G';
    states[Connection.CELL_4G]  = '4G';
    //iOS and WP can't detect the type of cellular network connection: Connection.CELL for all cellular data.
    states[Connection.CELL]     = 'Edge/2G/3G/4G';
    states[Connection.NONE]     = 'No network connection';

    if (networkState != Connection.WIFI) {
        var txt = "";
        if (networkState == Connection.NONE) {
            txt += states[networkState] + " detected. Make sure your are connected.";
        } else {
            txt += "You are connected to a " + states[networkState] + " network. ";
            txt += "This application needs to send an important amount of ";
            txt += "data during the Optical Character Recognition. ";
            txt += "WiFi is highly recommended!";
        }

        showNotification(txt, "WARNING");
    }

}


var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var captureID = 'capture1';

// Wait for device API libraries to load
document.addEventListener("deviceready",onDeviceReady,false);

// device APIs are available
function onDeviceReady() {
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;
    navigator.splashscreen.hide();
    checkConnection();
}


function sendForm() {
    // verify if photos have been taken
    var elt, elt2;
    elt = $('#capture1').attr('src')
    elt2 = $('#capture2').attr('src')
    basic_img = "images/button_citation_pressed3.png";

    if (elt == basic_img && elt2 == basic_img) {
        var form = $('#bibupform');
        var formData = $(form).serialize();
        $.ajax({
            type: 'POST',
            url: $(form).attr('action'),
            data: formData
        })
        .done(function() {
            // hide loader msg
            $.mobile.loading('hide');
            showNotification("The reference has been sent! The book will be available soon at www.unifr.ch/go/bibup", "Reference sent");
            cleanScanData();
            goTo('#home');
        })
        .fail(function() {
            showNotification("Something went wrong. Please, try again.", "Error");
        });

    } else {
        var options = new FileUploadOptions();
        var boundary = "----JIMENEZ";
        if (captureID == 'capture1') {
            options.fileKey = "contentSnapshot"; //name of the form element
            options.fileName = "imagebiblio.jpg"
        } else {
            options.fileKey = "titleSnapshot"; //name of the form element
            options.fileName = "imagebiblio1.jpg"
        }

        var imageURI = document.getElementById(captureID).src;
        options.mimeType = "image/*";

        options.params = {
            tag: document.getElementById("tag").value,
            isbn: document.getElementById("isbn").value,
            submit: document.getElementById("submit").value,
            titleSnapshot: "button_citation3.png" //this means that no image was selected for this field
        }

        options.chunkedMode = false; //to prevent problems uploading to a Nginx server.
        var ft = new FileTransfer();
        ft.upload(imageURI, encodeURI($('#bibupform').attr('action')), win, fail, options, true);
    }


}
function win(r) {
    // alert("Code = " + r.responseCode);
    // alert("Response = " + r.response);
    // alert("Sent = " + r.bytesSent);
    $.mobile.loading('hide');
    showNotification("The reference has been sent! The book will be available soon at www.unifr.ch/go/bibup", "Reference sent");
    cleanScanData();
    goTo('#home');
}
function fail(error) {
    var states = {};
    var txt = '';
    states[FileTransferError.FILE_NOT_FOUND_ERR]  = 'File not found.';
    states[FileTransferError.INVALID_ID_URL_ERR]  = 'Invalid URL.';
    states[FileTransferError.CONNECTION_ERR]      = 'Verify your connection and try again.';
    states[FileTransferError.ABORT_ERR]           = 'Aborting';


    if (error.code == FileTransferError.CONNECTION_ERR) {
        txt += states[error.code]
        showNotification(txt, "Error");
    } else {
        showNotification("Something went wrong. Please, try again.", "Error");
    }
}

// Called when a photo is successfully retrieved
function onPhotoURISuccess(imageURI) {
    var elt;// = document.getElementById( captureID );

    if ( 'capture1' == captureID ) {
        elt = document.getElementById( 'capture1' );
        elt.style.display = 'block';
        elt.src = imageURI;
    } else {
        elt = document.getElementById( 'capture2' );
        elt.style.display = 'block';
        elt.src = imageURI;
    }
}

function testUpload() {
    alert("img-src: " + $('#capture1').attr('src'));
    alert("titlesnap: " + $('#titleShapshot').attr('value'));
    // alert("contentsnap: " + $('#contentShapshot').attr('value'));
}
// A button will call this function
//
function capturePhoto( elt ) {
  captureID = elt;
  // Take picture using device camera and retrieve image as base64-encoded string
  navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50,
    destinationType: destinationType.FILE_URI });
}

// Called if something bad happens.
//
function onFail(message) {
    //direct call to alert can cause problems on iOS
    setTimeout(function() {
        showNotification("Failed because: " + message, "Error");
    }, 0);
}

function scanCode() {
    if ($('#tag').attr('value')) {
        cordova.plugins.barcodeScanner.scan( function(result) {
                if (result.text != '') {
                    $( "#isbn" ).html( result.text );
                    getInfoFromCode( result.text );
                } else { // go back to home page if scan is discarded
                    goTo('#home');
                }

            }, function(error) {
                showNotification("Scanning failed: " + error, "Error");
            }
        );
    } else {
        showNotification("You have to give a tag to later be able to find your references on: www.unifr.ch/go/bibup", "Tag is mandatory");
    }

}


function openBibUp() {
     var ref = window.open('http://elearning.unifr.ch/bibup', '_blank', 'location=no');
}

function getInfoFromCode( code ) {
    $('#isbn').attr( { value: code });
    $.get( "https://www.googleapis.com/books/v1/volumes?q=isbn:" + code, function( data ) {
        if ( 0 == data.totalItems ) {
            showNotification("Not a valid ISBN/ISSN number.", "Invalid Field");
        }
        displayData( data );
    })
    .fail( function() { showNotification("Verify your network connexion.", "Error"); });
}

function displayData( data ) {
    // reset for previous scan
    $( "#book_subtitle" ).html('');
    $( "#book_subtitle" ).hide();
    $( "#book_cover" ).hide();

    // reset capture
    $( "#capture1" ).attr( { src: 'images/button_citation_pressed3.png' } );
    $( "#capture2" ).attr( { src: 'images/button_citation_pressed3.png' } );

    $( "#book_title" ).html( data.items[0].volumeInfo.title );
    if ( null != data.items[0].volumeInfo.subtitle ) {
        $( "#book_subtitle" ).html( data.items[0].volumeInfo.subtitle );
        $( "#book_subtitle" ).show();
    }
    $( "#book_author" ).html( data.items[0].volumeInfo.authors.toString() );
    $( "#book_publisher" ).html( data.items[0].volumeInfo.publisher );
    $( "#book_year" ).html( data.items[0].volumeInfo.publishedDate.split('-')[0] );
    $( "#book_lang" ).html( data.items[0].volumeInfo.language );

    // $( "#book_isbn_type" ).html( data.items[0].volumeInfo.industryIdentifiers[0].type ); //show isbn_10
    $( "#book_isbn_data" ).html( data.items[0].volumeInfo.industryIdentifiers[1].identifier ); //show isbn_13


    if ( null != data.items[0].volumeInfo.imageLinks ) {
        $( "#book_cover" ).attr( { src: data.items[0].volumeInfo.imageLinks.thumbnail } );
        $( "#book_cover" ).show();
    }

    $( "#book" ).show();
    $( "#ocr" ).show();
    $( "#submit" ).removeClass( 'ui-disabled' )
    $( '#submit' ).show();
    $( "#scanbook" ).hide();
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#scan" );
}

function cleanScanData() {
    $( "#book_subtitle" ).html('');
    $( "#book_subtitle" ).hide();
    $( "#book_cover" ).hide();
    $( "#book" ).hide();

    // reset capture
    $( "#capture1" ).attr( { src: 'images/button_citation_pressed3.png' } );
    $( "#capture2" ).attr( { src: 'images/button_citation_pressed3.png' } );

    // disable submit
    $( '#submit' ).addClass('ui-disabled');
    $( '#submit' ).hide();
    $( '#ocr' ).hide();

    // reinitialize filenames for form input file
    $('#titleSnapshot').value = 'button_citation3.png';
    $('#contentSnapshot').value = 'button_citation3.png';

    $( '#scanbook' ).show();
}

function testCode() {
    getInfoFromCode('1430239034');
}

function manualCode() {
    if ($('#tag').attr('value')) {
        if ($('#manualisbn').val()) {
            var code = $('#manualisbn').val();
            getInfoFromCode(code);
        } else {
            showNotification("You must provide an ISBN/ISSN number", "Invalid Field");
        }
    } else {
        showNotification("You have to give a tag to later be able to find your references on: www.unifr.ch/go/bibup", "Tag is mandatory");
    }

}

function setTag( data ) {
    $('#tag').attr( { value: data });
}

$(function() {
    var form = $('#bibupform');

    $(form).submit(function(event) {
        event.preventDefault();
        // display a loading window during the transfer
        $.mobile.loading( "show", {
            text: "Depending on your network speed it might take some time (up to 3 minutes) to upload your data.",
            textVisible: true,
            theme: "b",
            textonly: false,
            html: ""
        });
        sendForm();
    });
});


function goTo( id ) {
    $( ":mobile-pagecontainer" ).pagecontainer( "change", id );
}


function previewImage(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        var elt;
        if ( 'titleSnapshot' == input.name ) {
            elt = '#capture1';
        } else {
            elt = '#capture2';
        }
        reader.onload = function (e) {
            $( elt ).attr('src',e.target.result)
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function alertDismissed() {
}


// Show native pop up
function tagInfo() {
    var msg = "You will use this tag to filter your references later in the list on the Bibup website: http://www.unifr.ch/go/bibup. Use a tag that is easy for you to remember.";
    var title = "Tag Informaiton";
    showNotification(msg, title);
}


function popupTest() {
    msg = 'You will use this tag to filter your references in the list on the Bibup website: <br /><a href="http://www.unifr.ch/go/bibup">http://www.unifr.ch/go/bibup</a>';
    navigator.notification.alert(
        msg,
        alertDismissed,
        'Popup Test',
        'Ok'
    );
}
