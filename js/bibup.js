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
    // event.preventDefault();
    homeView();
}

function renderScanView(event) {
    // event.preventDefault();
    scanView();
}

function renderAboutView(event) {
    // event.preventDefault();
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
}

// Called when a photo is successfully retrieved
function onPhotoURISuccess(imageURI) {
  var elt = document.getElementById( captureID );
  // Unhide image elements
  elt.style.display = 'block';
  // Show the captured photo
  // The inline CSS rules are used to resize the image
  elt.src = imageURI;

  if ( 'capture1' == captureID ) {
    elt2 = elt = document.getElementById( 'capture1' );
    elt2.src = imageURI;
  } else {
    elt2 = elt = document.getElementById( 'capture2' );
    elt2.src = imageURI;
  }
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
  alert('Failed because: ' + message);
}

function scanCode() {
    if ($('#tag').attr('value')) {
        var platform = device.platform;
        cordova.plugins.barcodeScanner.scan( function(result) {
                $( "#isbn" ).html( result.text );
                getInfoFromCode( result.text );
            }, function(error) {
                alert("Scanning failed: " + error);
            }
        );
    } else {
        alert("You must provide a tag to filter your references later");
    }

}

function mCode() {
    alert("hello1");
    //     if ($('#tag').attr('value')) {
    //         alert("hello");
    //         var code = $('#manualisbn').val();
    //         getInfoFromCode(code);
    //     } else {
    //         alert("You must provide a tag to filter your references later");
    //     }

}

function openBibUp() {
     var ref = window.open('http://elearning.unifr.ch/bibup', '_blank', 'location=no');
}

function getInfoFromCode( code ) {
    $('#isbn').attr( { value: code });
    $.get( "https://www.googleapis.com/books/v1/volumes?q=isbn:" + code, function( data ) {
        if ( 0 == data.totalItems ) {
            alert('Not a valid ISBN/ISSN number.');
        }
        displayData( data );
    })
    .fail( function() { alert("Error: verify your network connexion.") } );
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
    $( "#book_isbn_type" ).html( data.items[0].volumeInfo.industryIdentifiers[0].type );
    $( "#book_isbn_data" ).html( data.items[0].volumeInfo.industryIdentifiers[0].identifier );
    //alert( "Book \"" + data.items[0].volumeInfo.title + "\" was scanned." );
    if ( null != data.items[0].volumeInfo.imageLinks ) {
        $( "#book_cover" ).attr( { src: data.items[0].volumeInfo.imageLinks.thumbnail } );
        $( "#book_cover" ).show();
    }

    $( "#book" ).show();
    $( "#ocr" ).show();
    $( "#submit" ).removeClass( 'ui-disabled' )
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

    $('#titleSnapshot').value= null;
    $('#contentSnapshot').value= null;

    $( '#scanbook' ).show();
}

function testCode() {
    getInfoFromCode('1430239034');
}

// function manualCode() {
//     alert("hello1");
//     if ($('#tag').attr('value')) {
//         alert("hello");
//         var code = $('#manualisbn').val();
//         getInfoFromCode(code);
//     } else {
//         alert("You must provide a tag to filter your references later");
//     }
//
// }

function setTag( data ) {
    $('#tag').attr( { value: data });
}

$(function () {
    $('#bibupform2').bind('submit', function (e) {
        e.preventDefault();
        $( '#ocr' ).html( $(this).serialize() );
        $.post('post.php', FormData($(this)), function (response) {});
        cleanScanData();
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
