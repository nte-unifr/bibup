$(document).ready(function(){
    homeView();
    $('.p-home').on('tap', renderHomeView);
    $('.p-scan').on('tap', renderScanView);
    $('.p-about').on('tap', renderAboutView);

    $('[data-role=footer]').addClass("ui-footer ui-bar-a");
    $('[data-role=navbar]').addClass("ui-navbar ui-mini");
});

// Get current page id
var activePage = '';
$( document ).on( "pagecontainershow", function ( event, ui ) {
    activePage = $.mobile.pageContainer.pagecontainer( "getActivePage" ).attr("id");
});

// Support for swipe gesture between pages
$(document).on('swipeleft', function(){
    if (activePage == 'home') {
        $.mobile.changePage("#scan", { transition: "slide"});
    } else if (activePage == 'scan') {
        $.mobile.changePage("#about", { transition: "slide"});
    } else if (activePage == 'about') {
        //do nothing
    } else {
        //do nothing
    }
});
$(document).on('swiperight', function(){
    if (activePage == 'home') {
        //do nothing
    } else if (activePage == 'scan') {
        $.mobile.changePage("#home", { transition: "slide", reverse: true});
    } else if (activePage == 'about') {
        $.mobile.changePage("#scan", { transition: "slide", reverse: true});
    } else {
        //do nothing
    }
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
function showNotification2(message , title, cb){
    if (navigator.notification) {
        navigator.notification.alert(message, cb, title, 'OK');
    } else {
        alert(title ? (title + ": " + message) : message);
    }
}
function showConfirm(message , title) {
    navigator.notification.confirm(message, onConfirm, title, ['Yes','Cancel']);
}
function onConfirm(buttonIndex) {
    console.log('You selected button ' + buttonIndex);
    return buttonIndex;
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
var devicePlatform;  // device platform: iOS or Android
var db; // access database
var cleanData = true; // true if no data in Book Info, false otherwise
var marc_lang = {
    "eng": "English",
    "fre": "French",
    "ger": "German",
    "ita": "Italian",
    "gsw": "Swiss german",
    "spa": "Spanish"
};
var refState = "none"; //none: no ref scanned, not sent: ref scanned but not sent or sent: ref scanned and sent (will immediately set to none...)

// Wait for device API libraries to load
document.addEventListener("deviceready",onDeviceReady,false);

// device APIs are available
function onDeviceReady() {
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;
    devicePlatform = device.platform;
    initForPlatform(devicePlatform);
    checkConnection();
    db = window.openDatabase("Database", "1.0", "Bibup", 200000);
    db.transaction(populateDB, errorCB, successCB);
}

/* ----------- DATABASE /begin -----------*/
// Populate the database
    //
    function populateDB(tx) {
        tx.executeSql('DROP TABLE IF EXISTS TAG');
        tx.executeSql('CREATE TABLE IF NOT EXISTS TAG (id integer primary key autoincrement, data)');
        tx.executeSql('INSERT INTO TAG (data) VALUES ("testna")');
        tx.executeSql('INSERT INTO TAG (data) VALUES ("testad")');
    }

    // Query the database
    //
    function queryDB(tx) {
        tx.executeSql('SELECT * FROM TAG', [], querySuccess, errorCB);
    }

    // Query the tag
    //
    function queryTag(tx) {
        var t = $('#tag').val();
        tx.executeSql('SELECT * FROM TAG WHERE data = "' +t+ '"', [], queryTagSuccess, errorCB);
    }

    // Query the insert tag
    //
    function insertTag(tx) {
        var t = $('#tag').val();
        tx.executeSql('INSERT INTO TAG (data) VALUES ("' +t+ '")', [], querySuccess, errorCB);
    }

    // Query the success callback
    //
    function queryTagSuccess(tx, results) {
        console.log("Returned rows = " + results.rows.length);
        if (results.rows.length == 0) {
            console.log(results.rows.length + ' match found');
            return true;
        }

        // this will be true since it was a select statement and so rowsAffected was 0
        if (!results.rowsAffected) {
            console.log('No rows affected!');
            return false;
        }
        // for an insert statement, this property will return the ID of the last inserted row
        console.log("Last inserted row ID = " + results.insertId);
    }

    // Query the success callback
    //
    function querySuccess(tx, results) {
        console.log("Returned rows = " + results.rows.length);
        // this will be true since it was a select statement and so rowsAffected was 0
        if (!results.rowsAffected) {
            console.log('No rows affected!');
            return false;
        }
        // for an insert statement, this property will return the ID of the last inserted row
        console.log("Last inserted row ID = " + results.insertId);
    }

    // Transaction error callback
    //
    function errorCB(err) {
        console.log("Error processing SQL: "+err.code);
    }

    // Transaction success callback
    //
    function successCB() {
        var db = window.openDatabase("Database", "1.0", "Bibup", 200000);
        db.transaction(queryDB, errorCB);
    }
/* ----------- DATABASE /end -------------*/


function openWindowWithPost() {
    var p = $('#introtag').val();
    var f = $('#bibform');

    $('#bibform-tag').val(p);
    console.log("forms values");
    f.submit();
}


function initForPlatform(dp) {
    if (dp == 'iOS') {
        $('.plat_android').remove();
    } else if (dp == 'Android') {
        $('.plat_ios').remove();
    } else {
        // TODO: adapt here if there is more platform
        $('.plat_ios').remove();
    }
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
    refState = "sent";
    $.mobile.loading('hide');
    showNotification("The reference has been sent! The book will be available soon at www.unifr.ch/go/bibup", "Reference sent");
    cleanScanData();
    refState = "none";
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

    refState = "not sent";
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

function scanCodeSB() {
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
}

function scanCode() {
    console.log("Ref state: " + refState);

    if ($('#tag').attr('value')) {
        if (refState == "not sent") { //there is a reference that has not been sent yet
            var message = "You have a reference that has not been submitted to Bibup yet, you will lose this reference if you scan another book. Do you want to continue?";
            navigator.notification.confirm(message,
                function(i) {
                    if (i == 1) {
                        console.log("Confirm, selected: " + i);
                        scanCodeSB();
                    } else {
                        console.log("Confirm, selected: " + i);
                        goTo("#home");
                    }
                }, "WARNING", ['Yes','No']);
        } else {
            scanCodeSB();
        }
    } else {
        showNotification("You have to give a tag to later be able to find your references on: www.unifr.ch/go/bibup", "Tag is mandatory");
        goTo('#home');
    }
}

// Open URL in device browser
function openUrl( url ) {
     window.open(url, '_system');
}


function getInfoFromCode( code ) {
    if (cleanData == false) {
        cleanScanData(); // clean Book Info before getting new data
    }
    $('#isbn').attr( { value: code });
    var codeType;
    var format = false;
    var x = code.substr(0, 3);
    console.log("Code: " + code);
    console.log("Code (0-3): " + x);
    if ( (code.length == 10) || ((code.length == 13) && (x == "978")) ) {
        codeType = "isbn";
        format = true;
    } else if ( (code.length == 8) || ((code.length == 13) && (x == "977")) ) {
        codeType = "issn";
        format = true;
    } else {
        console.log("Invalid format detected for isbn/issn.");
        format = false;
    }

    //valid format
    if (format == true) {
        console.log("http://xisbn.worldcat.org/webservices/xid/" +codeType+ "/" +code+ "?method=getMetadata&fl=*&format=json");
        $.getJSON( "http://xisbn.worldcat.org/webservices/xid/" +codeType+ "/" +code+ "?method=getMetadata&fl=*&format=json", function( data ) {
            console.log(data);
            if ( data.stat == "unknownId" ) {
                showNotification("No book found.", "Sorry");
                refState = "none";
            } else if ( data.stat == "invalidId" ) {
                showNotification("Please, enter a valid ISBN/ISSN. A valid ISBN/ISSN contains either 8, 10 or 13 digits.", "Invalid Field");
                refState = "none";
            } else if ( data.stat == "ok") {
                refState = "not sent";
                displayData( data, codeType );
            }
        })
        .fail( function( error ) { showNotification("Verify your network connexion.", "Error"); });
    } else {
        //invalid format
        showNotification("Please, enter a valid ISBN/ISSN. A valid ISBN/ISSN contains either 8, 10 or 13 digits.", "Invalid Field");
        refState = "none";
    }

}


function displayData( data, type ) {
    if (cleanData == false) {
        cleanScanData(); // clean Book Info before displaying data
    }

    if (type == "isbn") {
        // Get book thumbnail from Google
        $.get( "https://www.googleapis.com/books/v1/volumes?q=isbn:" + data.list[0].isbn, function( gdata ) {
            if ( gdata.totalItems != 0 ) {
                if ( gdata.items[0].volumeInfo.imageLinks != null ) {
                    $( "#book_cover" ).attr( { src: gdata.items[0].volumeInfo.imageLinks.thumbnail } );
                    $( "#book_cover" ).show();
                }
            }
        });

        var sub = data.list[0].title.split(":");
        if ( sub.length == 2 ) {
            $( "#book_title" ).html( sub[0].trim() );
            $( "#book_subtitle" ).html( sub[1].trim() );
            $( "#book_subtitle" ).show();
        } else {
            $( "#book_title" ).html( data.list[0].title );
        }
        $( "#book_author" ).html( data.list[0].author );
        $( "#book_author" ).show();
        $( "#book_author" ).prev().show();

        $( "#book_publisher" ).html( data.list[0].publisher );

        $( "#book_year" ).html( data.list[0].year );
        $( "#book_year" ).show();
        $( "#book_year" ).prev().show();

        if (data.list[0].lang in marc_lang) {
            $( "#book_lang" ).html( marc_lang[data.list[0].lang] );
        } else {
            $( "#book_lang" ).html( data.list[0].lang.toUppercase() );
        }
        $( "#book_lang" ).show();
        $( "#book_lang" ).prev().show();

        $( "#book_isbn_type" ).html( "ISBN" );
        $( "#book_isbn_data" ).html( data.list[0].isbn );


    } else if (type == "issn") {
        $( "#book_title" ).html( data.group[0].list[0].title );

        $( "#book_author" ).html('');
        $( "#book_author" ).hide();
        $( "#book_author" ).prev().hide();

        $( "#book_publisher" ).html( data.group[0].list[0].publisher );

        $( "#book_year" ).html('');
        $( "#book_year" ).hide();
        $( "#book_year" ).prev().hide();

        $( "#book_lang" ).html('');
        $( "#book_lang" ).hide();
        $( "#book_lang" ).prev().hide();

        $( "#book_isbn_type" ).html( "ISSN" );
        $( "#book_isbn_data" ).html( data.group[0].list[0].issn );
    }

    $( "#book" ).show();
    $( "#ocr" ).show();
    $( "#submit" ).removeClass( 'ui-disabled' )
    $( '#submit' ).show();
    $( "#scanbook" ).hide();
    cleanData = false;
    goTo("#scan");
}


function cleanScanData() {
    refState = "none";
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
    cleanData = true;
}


function testCode() {
    getInfoFromCode('1430239034');
}


function manualCodeCB() {
    if ($('#manualisbn').val()) {
        var code = $('#manualisbn').val();
        getInfoFromCode(code);
    } else {
        showNotification("Please, enter a valid ISBN/ISSN. A valid ISBN/ISSN contains either 8, 10 or 13 digits.", "Invalid Field");
    }
}

function manualCode() {
    if ($('#tag').attr('value')) {
        if (refState == "not sent") { //there is a reference that has not been sent yet
            var message = "You have a reference that has not been submitted to Bibup yet, you will lose this reference if you search another book. Do you want to continue?";
            navigator.notification.confirm(message,
                function(i) {
                    if (i == 1) {
                        console.log("Confirm, selected: " + i);
                        manualCodeCB();
                    } else {
                        console.log("Confirm, selected: " + i);
                        goTo("#home");
                    }
                }, "WARNING", ['Yes','No']);
        } else {
            manualCodeCB();
        }

    } else {
        showNotification("You have to give a tag to later be able to find your references on: www.unifr.ch/go/bibup", "Tag is mandatory");
    }
}


function setTag( data ) {
    $('#tag').attr( { value: data });
    db.transaction(queryTag, errorCB, successCB);
    db.transaction(queryTag, errorCB, function() { if (successCB) { db.transaction(insertTag, errorCB, successCB); } });
    // db.transaction(insertTag, errorCB, successCB);
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
