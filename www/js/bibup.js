var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var captureID = 'capture1';
var devicePlatform;  // device platform: iOS or Android
var db; // access database
var marc_lang = {
    "eng": "English",
    "fre": "French",
    "ger": "German",
    "ita": "Italian",
    "gsw": "Swiss german",
    "spa": "Spanish"
};
var uniqid = null; //unique id from bibup db server
var img_num = 0; //number of images to upload


// Wait for device API libraries to load
document.addEventListener("deviceready",onDeviceReady,false);
// Uncoment the 3 following lines for development in browser only!
// db = window.openDatabase("Database", "1.0", "Bibup", 200000);
// db.transaction(populateDB, errorCB, successCB);
// checkFirstLaunch();

// device APIs are available
function onDeviceReady() {
    pictureSource=navigator.camera.PictureSourceType;
    destinationType=navigator.camera.DestinationType;
    devicePlatform = device.platform;
    initForPlatform(devicePlatform);
    checkConnection();
    db = window.openDatabase("Database", "1.0", "Bibup", 200000);
    db.transaction(populateDB, errorCB, successCB);
    if (devicePlatform == 'Android')
        window.plugins.orientationchanger.lockOrientation('sensor');

    checkFirstLaunch();
    showFiches();
}

window.addEventListener('load', function() {
    new FastClick(document.body);
}, false);

$(document).on('pagebeforeshow', '#book_list', function(){
    $('#my_books').off('click', 'a').on('click', 'a', function() {
        if ($(this).hasClass("ui-icon-delete")) {
            console.log("deleting " + $(this).parent().data("ficheid"));
            deleteFiche($(this).parent().data("ficheid"));
        } else {
            console.log("book clicked " + $(this).parent().data("ficheid"));
            showBookInfo($(this).parent().data("ficheid"), $(this).parent().attr("data-ficheisbn"));
        }
        return false;
    });
});

$('.p-home').on('tap', renderHomeView);
$('.p-book_list').on('tap', renderBookListView);
$('.p-about').on('tap', renderAboutView);



$(document).on('pagebeforeshow', function(){
    $(".ui-btn:not(.ui-icon-delete)").on('touchstart' ,function(){
        $(this).css("background-color","#189fda");
    }).on('touchend', function(){
        $(this).css("background-color","#24ace7");
    }).on("touchcancel", function() {
        $(this).css("background-color","#24ace7");
     });
});


function initBody() {
    $('[data-role=footer]').addClass("ui-footer ui-bar-a");
    $('[data-role=navbar]').addClass("ui-navbar ui-mini");
    $('#manual-isbn [data-role=navbar]').removeClass("ui-mini");
    $('#manual-isbn .ui-navbar li a').css("font-size", "16.5px");
}

function checkValidation(input) {
    var isValid = input.checkValidity();
    var isLengthValid = null;
    if (input.name == "manualisbn") {
        //check that the length is validity
        if (input.value.length == 8 || input.value.length == 10 || input.value.length == 13) {
            isLengthValid = true;
        } else {
            isLengthValid = false;
        }
    }
    console.log("validity: " + isValid);
    if ((isValid == false && isLengthValid == null) || (isValid == false && isLengthValid == false) || (isValid == true && isLengthValid == false)) {
        $(input).parent().css("box-shadow","0 0 2px red");
    } else {
        $(input).parent().css("box-shadow","none");
    }
}

// Get current page id
var activePage = '';
$( document ).on( "pagecontainershow", function ( event, ui ) {
    activePage = $.mobile.pageContainer.pagecontainer( "getActivePage" ).attr("id");
});

// Support for swipe gesture between pages
$(document).on('swipeleft', function(){
    if (activePage == 'home') {
        $.mobile.changePage("#book_list", { transition: "slide"});
    } else if (activePage == 'book_list') {
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
    } else if (activePage == 'book_list') {
        $.mobile.changePage("#home", { transition: "slide", reverse: true});
    } else if (activePage == 'about') {
        $.mobile.changePage("#book_list", { transition: "slide", reverse: true});
    } else {
        //do nothing
    }
});

// --- Render views
//
function renderHomeView(event) {
    homeView();
}
function renderBookListView(event) {
    bookListView();
}
function renderAboutView(event) {
    aboutView();
}


// --- Views
//
function homeView(event) {
    // active state for navbar
    $('#home .p-home, #home .p-book_list, #home .p-about').removeClass("ui-btn-active");
    $('#home .p-home').addClass("ui-btn-active");
}
function bookListView(event) {
    // active state for navbar
    $('#book_list .p-home, #book_list .p-book_list, #book_list .p-about').removeClass("ui-btn-active");
    $('#book_list .p-book_list').addClass("ui-btn-active");
}
function aboutView(event) {
    // active state for navbar
    $('#about .p-home, #about .p-book_list, #about .p-about').removeClass("ui-btn-active");
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






/* ----------- DATABASE /begin -----------*/
// Populate the database
    //
    function populateDB(tx) {
        // tx.executeSql('DROP TABLE IF EXISTS tag');
        // tx.executeSql('DROP TABLE IF EXISTS fiche');
        // tx.executeSql('CREATE TABLE IF NOT EXISTS tag (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(50))');
        tx.executeSql("CREATE TABLE IF NOT EXISTS fiche (id INTEGER PRIMARY KEY AUTOINCREMENT, isbn VARCHAR(13), title VARCHAR(250), author VARCHAR(100), tag VARCHAR(50), note VARCHAR(255), datecreated TIMESTAMP DEFAULT (datetime('now','localtime')), image INTEGER(1))");
        // tx.executeSql('INSERT INTO tag (name) VALUES ("testna")');
        // tx.executeSql('INSERT INTO tag (name) VALUES ("testad")');
        // tx.executeSql('INSERT INTO fiche (isbn, title, author, tag, note) VALUES ("9781565921320", "Using csh and tcshh", "Paul DuBois.", "testna", "test note for csh and tcsh")');
        // tx.executeSql('INSERT INTO fiche (isbn, title, author, tag, note) VALUES ("0596006527", "Essential ActionScript 2.0", "someone", "testna", "test note for actionscript")');
        // tx.executeSql('INSERT INTO config (first_launch) VALUES (0)');
    }

    // Query the database
    //
    function queryDB(tx) {
        tx.executeSql('SELECT * FROM tag', [], querySuccess, errorCB);
    }

    function updateFirstLaunch() {
        console.log("update config");
        window.localStorage.setItem("first_launch", 1);
    }

    function checkFirstLaunch() {
        var value = window.localStorage.getItem("first_launch");
        if (value == null) {
            window.localStorage.setItem("first_launch", 0);
            //show page introduction to bibup
            console.log("intro page");
            goTo( "#first-intro" );
        } else if (parseInt(value) == 0) {
            //show page introduction to bibup
            console.log("intro page");
            goTo( "#first-intro" );
        } else {
            //show homepage
            console.log("home page");
            goTo( "#home" );
        }

    }

    // Query the database
    //
    function getFiches(tx) {
        var q = '';
        var list_empty = true;
        if ($('#my_books li').length == 0) {
            q = 'SELECT id, title, isbn, author, LENGTH(isbn) as isbn_len FROM fiche ORDER BY id DESC';
            list_empty = true;
            $('#no-book-list .big-msg').show();
            $('#no-book-list h2').hide();
        } else {
            var lastID = $('#my_books li:first-child').attr("data-ficheid");
            console.log("Last ID: " + lastID);
            q = 'SELECT id, title, isbn, author, LENGTH(isbn) as isbn_len FROM fiche WHERE id > ' +lastID+ ' ORDER BY id ASC';
            list_empty = false;
            $('#no-book-list .big-msg').hide();
            $('#no-book-list h2').show();
        }
        tx.executeSql(q, [],
        function(tx, results) {
            if (results.rows.length != 0) {
                for (var i=0; i<results.rows.length; i++) {
                    // Each row is a standard JavaScript array indexed by column names.
                    var row = results.rows.item(i);
                    console.log(row.id + " // " + row.isbn + " ("+ row.isbn_len +") // " + row.title + " // " + row.author);
                    var elt = '<li data-ficheid="' +row.id+ '" data-ficheisbn="' + row.isbn + '"><a href="#"><p>' +row.title+ ', '+row.author+'</p></a></li>';
                    if (list_empty == true) {
                        $('#my_books').append(elt);
                        $('#no-book-list .big-msg').hide();
                        $('#no-book-list h2').show();
                    } else {
                        $('#my_books').prepend(elt);
                    }

                }

                $("#my_books").listview('refresh'); //refresh content
                $('#my_books').show();
            } else {
                return false;
            }

        }, errorCB);
    }

    function deleteFiche(id) {
        db.transaction( function(tx) {
            var query = 'DELETE FROM fiche WHERE id = ' + id;
            tx.executeSql(query, [], function() {
                $('#my_books li[data-ficheid="'+ id +'"]').remove();
                if ($('#my_books li').length == 0) {
                    $("#edit").trigger("click");
                    showFiches();
                }
                console.log("ficheid " +id+ " deleted");
            }, errorCB);
        });
    }

    function deleteAllFiches() {
        var message = "All references below will be deleted from this device, but they will still remain on https://elearning.unifr.ch/bibup. Do you want to continue?";
        navigator.notification.confirm(message,
            function(i) {
                if (i == 1) {
                    console.log("Confirm, selected: " + i);
                    db.transaction( function(tx) {
                        var query = 'DELETE FROM fiche';
                        tx.executeSql(query, [], function() {
                            $('#my_books li').each( function(index) {
                                $(this).remove();
                            });
                            console.log("all fiches deleted");
                            $('#edit').trigger("click");
                            showFiches();
                        }, errorCB);
                    });
                } else {
                    console.log("Confirm, selected: " + i);
                }
            }, "WARNING", ['Yes','No']);


    }


    function getNoteFromFiche(id) {
        db.transaction( function(tx) {
            var query = 'SELECT note, tag, image FROM fiche WHERE id = ' + id;
            tx.executeSql(query, [],
            function(tx, results) {
                var row = results.rows.item(0);
                if (row.note != '') {
                    $('#book_info [data-book="note"]').show();
                    $('#book_info [data-book="note"]').prev().show();
                    $('#book_info [data-book="note"]').html( row.note );

                } else {
                    $('#book_info [data-book="note"]').hide();
                    $('#book_info [data-book="note"]').prev().hide();
                }

                $('#book_info [data-book="tag"]').html( '<a href="#" onclick="openUrl(\'https://elearning.unifr.ch/bibup/index.php?tag='+row.tag+'&filter=Filter\');">' + row.tag + '</a>' );

                var img_plural = row.image > 1 ? 'images' : 'image';
                $('#book_info [data-book="image"]').html( row.image + ' ' +img_plural+ ' uploaded' );

                $("#book_info ul").listview('refresh');


            }, errorCB);
        });
    }


    // Query the insert tag
    //
    function insertTag(tx) {
        var t = $('#tag').val();
        tx.executeSql('SELECT * FROM tag WHERE name = "' +t+ '"', [],
            function(tx, result) {
                if (result.rows.length != 0) {
                    console.log(result.rows.length + ' match found');
                    return false;
                }
                console.log(result.rows.length + ' match found');
                tx.executeSql('INSERT INTO tag (name) VALUES ( ? )', [ t ], querySuccess, errorCB);
            },
            errorCB);
    }

    // Query the insert fiche
    //
    function insertFiche(success, error) {
        db.transaction( function(tx) {
            var t_isbn = $('#isbn').val(),
                t_tag = $('#tag').val(),
                t_note = $('#book_note').html(),
                t_title = $('#scan [data-book="title"]').html(),
                t_author = $('#scan [data-book="author"]').html();
                $('#book_note').html(''); // clean div
            console.log("insertFiche data (isbn, tag, title, author, note, num): " + t_isbn + " // " + t_tag + " // " + t_title + " // " + t_author + " // " + t_note + " // " + img_num);
            tx.executeSql('INSERT INTO fiche (isbn, tag, title, author, note, image) VALUES ( ?, ?, ?, ?, ?, ? )', [ t_isbn, t_tag, t_title, t_author, t_note, img_num ],
            function() {
                if (success) {
                    showNotification("The reference has been sent! The book will be available soon at https://elearning.unifr.ch/bibup", "Reference sent");
                    cleanScanData('#scan');
                    showFiches();
                    goTo('#home');
                }
            },
            function() {
                if (error) {
                    console.log("Error occured during fiche insertion.");
                }
            });
        });
    }
    var insertOk = function() { console.log("insert OK."); };
    var insertNotOk = function() { console.log("insert not OK."); };

    function showFiches() {
        db.transaction(getFiches, errorCB, successCB);
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
    function errorCB(error) {
        console.log('Error: '+error.message+' (Code '+error.code+')');
    }

    // Transaction success callback
    //
    function successCB() {
        console.log("Success.");
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
    elt = $('#capture1').attr('src');
    elt2 = $('#capture2').attr('src');
    basic_img = "images/button_citation_pressed3.png";
    var book_note = $('#note').val();
    $('#book_note').html(book_note);

    if (elt == basic_img && elt2 == basic_img) {
        var form = $('#bibupform');
        var formData = $(form).serialize();
        img_num = 0;
        $.ajax({
            type: 'POST',
            url: $(form).attr('action'),
            data: formData
        })
        .done(function() {
            // hide loader msg
            $.mobile.loading('hide');
            insertFiche(insertOk, insertNotOk);
        })
        .fail(function() {
            showNotification("Something went wrong. Please, try again.", "Error");
        });

    } else if (elt != basic_img && elt2 == basic_img) { //only first image to upload

        console.log("uploading 1st image");
        img_num = 1;
        uploadImage1(false);

    } else if (elt == basic_img && elt2 != basic_img) { //only first image to upload

        console.log("uploading 2nd image");
        img_num = 1;
        uploadImage2(uniqid);

    } else { //both images to upload

        console.log("uploading both images");
        img_num = 2;
        uploadImage1(true);

    }
}

function uploadImage1(both) {
    var options = new FileUploadOptions();
    options.fileKey = "contentSnapshot"; //name of the form element
    options.fileName = "imagebiblio.jpg";

    var imageURI = document.getElementById("capture1").src;
    options.mimeType = "image/*";

    options.params = {
        tag: document.getElementById("tag").value,
        isbn: document.getElementById("isbn").value,
        submit: document.getElementById("submit").value,
        titleSnapshot: "button_citation3.png", //this means that no image was selected for this field
        note: document.getElementById("note").value
    }

    options.chunkedMode = false; //to prevent problems uploading to a Nginx server.
    var ft = new FileTransfer();
    if (both) {
        ft.upload(imageURI, encodeURI($('#bibupform').attr('action')), win1, fail, options, true); //upload both images
    } else {
        ft.upload(imageURI, encodeURI($('#bibupform').attr('action')), win2, fail, options, true); //upload only 1st image
    }

}

function uploadImage2(id) {
    var options = new FileUploadOptions();
    options.fileKey = "titleSnapshot"; //name of the form element
    options.fileName = "imagebiblio1.jpg";

    var imageURI = document.getElementById("capture2").src;
    options.mimeType = "image/*";

    console.log("uid in 2nd upload: " + id);
    options.params = {
        tag: document.getElementById("tag").value,
        isbn: document.getElementById("isbn").value,
        submit: document.getElementById("submit").value,
        contentSnapshot: "button_citation3.png", //this means that no image was selected for this field
        uid: id,
        note: document.getElementById("note").value
    }

    options.chunkedMode = false; //to prevent problems uploading to a Nginx server.
    var ft = new FileTransfer();
    ft.upload(imageURI, encodeURI($('#bibupform').attr('action')), win2, fail, options, true);
}

function win1(r) {
    console.log("---");
    console.log("win");
    var test = $.trim(r.response);
    test = test.substr(0,1);
    console.log("res (" +$.trim(r.response)+ "): " + test);
    if (test == "#") { //it's ok, get the id now
        var response = r.response.split("##");
        uniqid = response[response.length - 1];
        console.log("uid: " + uniqid);
        console.log("uploading 2nd image");
        uploadImage2(uniqid);
    } else {
        console.log("problem: " + r.response);
    }
}

function win2(r) {
    console.log("---");
    console.log("win2");
    var test = $.trim(r.response);
    test = test.substr(0,1);
    console.log("res (" +$.trim(r.response)+ "): " + test);
    if (test == "#") { //it's ok, get the id now
        var response = r.response.split("##");
        uniqid = response[response.length - 1];
        console.log("uid: " + uniqid);
    } else {
        console.log("problem: " + r.response);
    }
    // alert("Code = " + r.responseCode);
    // alert("Response = " + r.response);
    // alert("Sent = " + r.bytesSent);
    uniqid = null;
    $('[data-refstate]').data("refstate", "sent");
    $.mobile.loading('hide');
    insertFiche(insertOk, insertNotOk);
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

    $('#scan').data("refstate", "not sent");
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
  if (devicePlatform == 'Android') {
      navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50,
        destinationType: destinationType.FILE_URI, correctOrientation: true });
  } else {
      navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50,
        destinationType: destinationType.FILE_URI });
  }
}

// Called if something bad happens (also called if we cancel the capture!)
//
function onFail(message) {
    //direct call to alert can cause problems on iOS
    setTimeout(function() {
        // showNotification("Failed because: " + message, "Error");
        console.log("Failed because: " + message);
    }, 0);
}

function scanCodeSB() {
    cordova.plugins.barcodeScanner.scan( function(result) {
            if (result.text != '') {
                $( "#isbn" ).html( result.text );
                getInfoFromCode( result.text, '#scan' );
            } else { // go back to home page if scan is discarded
                goTo('#home');
            }

        }, function(error) {
            showNotification("Scanning failed: " + error, "Error");
        }
    );
}

function scanCode() {
    var refstate = $('[data-refstate]').data("refstate");
    if ($('#tag').attr('value')) {
        if (refstate == "not sent") { //there is a reference that has not been sent yet
            var message = "You have a reference that has not been submitted to BibUp yet, you will lose this reference if you scan another book. Do you want to continue?";
            navigator.notification.confirm(message,
                function(i) {
                    if (i == 1) {
                        console.log("Confirm, selected: " + i);
                        scanCodeSB();
                    } else {
                        console.log("Confirm, selected: " + i);
                        goTo("#scan");
                    }
                }, "WARNING", ['Yes','No']);
        } else {
            scanCodeSB();
        }
    } else {
        showNotification("You have to give a tag to later be able to find your references on: https://elearning.unifr.ch/bibup", "Tag is mandatory");
        goTo('#home');
    }
}

// Open URL in device browser
function openUrl( url ) {
     window.open(url, '_system');
}


function showBookInfo( id, isbn ) {
    getNoteFromFiche(id);
    getInfoFromCode(isbn.toString(), '#book_info');
}


function getInfoFromCode( code, page ) {
    var cleanData = $( page + ' [data-clean]' ).data("clean");
    if (cleanData == false) {
        cleanScanData( page ); // clean Book Info before getting new data
    }
    $('#isbn').attr( { value: code });
    var codeType;
    var format = false;
    var x = code.substr(0, 3);
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
        var request = "http://xisbn.worldcat.org/webservices/xid/" +codeType+ "/" +code+ "?method=getMetadata&fl=*&format=json";
        console.log(request);
        $.getJSON(request, function( data ) {
            if ( data.stat == "unknownId" ) {
                showNotification("No book found.", "Sorry");
                if (page == '#scan') { $('[data-refstate]').data("refstate", "none"); }
            } else if ( data.stat == "invalidId" ) {
                showNotification("Please, enter a valid ISBN/ISSN. A valid ISBN/ISSN contains either 8, 10 or 13 digits.", "Invalid Field");
                if (page == '#scan') { $('[data-refstate]').data("refstate", "none"); }
            } else if ( data.stat == "ok") {
                if (page == '#scan') { $('[data-refstate]').data("refstate", "not sent"); }
                displayData( data, codeType, page );
            }
        })
        .fail( function( error ) { showNotification("Verify your network connexion.", "Error"); });
    } else {
        //invalid format
        showNotification("Please, enter a valid ISBN/ISSN. A valid ISBN/ISSN contains either 8, 10 or 13 digits.", "Invalid Field");
        $('[data-refstate]').data("refstate", "none");
    }

}


function displayData( data, type, page ) {
    var cleanData = $( page + ' [data-clean]' ).data("clean");
    if (cleanData == false) {
        cleanScanData( page ); // clean Book Info before displaying data
    }

    if (type == "isbn") {
        // Get book thumbnail from Google
        $.get( "https://www.googleapis.com/books/v1/volumes?q=isbn:" + data.list[0].isbn, function( gdata ) {
            if ( gdata.totalItems != 0 ) {
                if ( gdata.items[0].volumeInfo.imageLinks != null ) {
                    $( page + ' [data-book="cover"]' ).attr( { src: gdata.items[0].volumeInfo.imageLinks.thumbnail } );
                    $( page + ' [data-book="cover"]' ).show();
                }
            }
        });

        var sub = data.list[0].title.split(":");
        if ( sub.length == 2 ) {
            $( page + ' [data-book="title"]' ).html( sub[0].trim() );
            $( page + ' [data-book="subtitle"]' ).html( sub[1].trim() );
            $( page + ' [data-book="subtitle"]' ).show();
        } else {
            $( page + ' [data-book="title"]' ).html( data.list[0].title );
        }
        $( page + ' [data-book="author"]' ).html( data.list[0].author );
        $( page + ' [data-book="author"]' ).show();
        $( page + ' [data-book="author"]' ).prev().show();

        $( page + ' [data-book="publisher"]' ).html( data.list[0].publisher );

        $( page + ' [data-book="year"]' ).html( data.list[0].year );
        $( page + ' [data-book="year"]' ).show();
        $( page + ' [data-book="year"]' ).prev().show();

        if (data.list[0].lang in marc_lang) {
            $( page + ' [data-book="lang"]' ).html( marc_lang[data.list[0].lang] );
        } else {
            $( page + ' [data-book="lang"]' ).html( data.list[0].lang.toUppercase() );
        }
        $( page + ' [data-book="lang"]' ).show();
        $( page + ' [data-book="lang"]' ).prev().show();

        $( page + ' [data-book="isbn_type"]' ).html( "ISBN" );
        $( page + ' [data-book="isbn_data"]' ).html( data.list[0].isbn );


    } else if (type == "issn") {
        $( page + ' [data-book="title"]' ).html( data.group[0].list[0].title );

        $( page + ' [data-book="author"]' ).html('');
        $( page + ' [data-book="author"]' ).hide();
        $( page + ' [data-book="author"]' ).prev().hide();

        $( page + ' [data-book="publisher"]' ).html( data.group[0].list[0].publisher );

        $( page + ' [data-book="year"]' ).html('');
        $( page + ' [data-book="year"]' ).hide();
        $( page + ' [data-book="year"]' ).prev().hide();

        $( page + ' [data-book="lang"]' ).html('');
        $( page + ' [data-book="lang"]' ).hide();
        $( page + ' [data-book="lang"]' ).prev().hide();

        $( page + ' [data-book="isbn_type"]' ).html( "ISSN" );
        $( page + ' [data-book="isbn_data"]' ).html( data.group[0].list[0].issn );
    }

    if (page == '#scan') {
        $( "#book" ).show();
        $( "#ocr" ).show();
        $( "#submit" ).removeClass( 'ui-disabled' )
        $( '#submit' ).show();
    }

    $( page + ' [data-clean]' ).data("clean", false);
    goTo(page);
}


function cleanScanData( page ) {
    $('[data-refstate]').data("refstate", "none");
    $( page + ' [data-book="title"]' ).html('');
    $( page + ' [data-book="subtitle"]' ).html('');
    $( page + ' [data-book="subtitle"]' ).hide();
    $( page + ' [data-book="author"]' ).html('');
    $( page + ' [data-book="publisher"]' ).html('');
    $( page + ' [data-book="year"]' ).html('');
    $( page + ' [data-book="lang"]' ).html('');
    $( page + ' [data-book="isbn_data"]' ).html('');
    $( page + ' [data-book="cover"]' ).hide();
    img_num = 0;

    if (page == '#scan') {
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

        // clean note field
        $('#note').val('');
        $('#note').html('');
        $('#book_note').html('');
    }

    $( page + ' [data-clean]' ).data("clean", true);
}


// function testCode() {
//     getInfoFromCode('1430239034');
// }


function manualCodeCB() {
    if ($('#manualisbn').val()) {
        var code = $('#manualisbn').val();
        getInfoFromCode(code, '#scan');
    } else {
        showNotification("Please, enter a valid ISBN/ISSN. A valid ISBN/ISSN contains either 8, 10 or 13 digits.", "Invalid Field");
    }
}

function manualCode() {
    var refstate = $('[data-refstate]').data("refstate");

    if ($('#tag').attr('value')) {
        if (refstate == "not sent") { //there is a reference that has not been sent yet
            var message = "You have a reference that has not been submitted to BibUp yet, you will lose this reference if you search another book. Do you want to continue?";
            navigator.notification.confirm(message,
                function(i) {
                    if (i == 1) {
                        console.log("Confirm, selected: " + i);
                        manualCodeCB();
                    } else {
                        console.log("Confirm, selected: " + i);
                        goTo("#scan");
                    }
                }, "WARNING", ['Yes','No']);
        } else {
            manualCodeCB();
        }

    } else {
        showNotification("You have to give a tag to later be able to find your references on: https://elearning.unifr.ch/bibup", "Tag is mandatory");
    }
}


function setTag( data ) {
    $('#tag').attr( { value: data });
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


function deleteFichesLayout( elt ) {
    console.log("in deleteFicheLayout");
    // change button
    if ( $(elt).data("mode") == "icon" ) {
        $(elt).buttonMarkup( { icon: "" }, false );
        $(elt).data("mode", "btn");
        if ($('#my_books li').length == 0) {
            $("#no-book-list button").hide();
        } else {
            $("#no-book-list button").show();
        }
    } else {
        $(elt).buttonMarkup( { icon: "edit", iconpos: "notext" }, false );
        $(elt).data("mode", "icon");
        $("#no-book-list button").hide();
    }
    $("#my_books").listview('refresh');
}
