// if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;

var fileID = null;
var fileName = null;
var connection = null;
var websocketAddr = document.location.host;

function websocketOpenListener() {
    console.log("connection established");
}

function websocketMessageListener(message) {
    var message_data = null;

    try {
        message_data = JSON.parse(message.data);
    } catch (e) {
        console.log(message.data);
        console.log(e);
        return;
    }

    if ("no_files" in message_data["status"]) {
        if (message_data["status"]["no_files"] === false) {
            $("#tab2-link").prop('class', 'nav-link');
            $("#tab30-link").prop('class', 'nav-link');
            $("#delete_files").show();
        }
    }
}

function websocketCloseListener(error) {
    console.log("connection closed...");        
    setTimeout(connectWebsocket, 1000, websocketAddr);    
}

function websocketErrorListener(error) {
    console.log(error);
    setTimeout(connectWebsocket, 1000, websocketAddr);
}

function connectWebsocket(addr) {    
    if (connection !== null ) {
        try {
            connection.removeEventListener('open', websocketOpenListener);
            connection.removeEventListener('message',websocketMessageListener);
            connection.removeEventListener('close',websocketCloseListener);
            connection.removeEventListener('error',websocketErrorListener);
        } catch (e) {
            console.log("Failed to remove listeners..");
        }
    }

    connection = new WebSocket(('https:' == document.location.protocol ? 'wss' : 'ws') + '://' + addr);  

    $("#server_conn").hide();

    connection.addEventListener('open',websocketOpenListener);
    connection.addEventListener('message',websocketMessageListener);
    connection.addEventListener('close',websocketCloseListener);
    connection.addEventListener('error',websocketErrorListener);
}

$(document).ready(function() {
    connectWebsocket(websocketAddr);

    console.log("contact server and check if anything is availble");
    // $("#progress_spinner").show();
    $("#tab2-link").prop('class', 'nav-link disabled');
    $("#tab30-link").prop('class', 'nav-link disabled');
    console.log("disable button")

    $('#delete_files').click(function() {
        $("#tab2-link").prop('class', 'nav-link disabled');
        $("#tab30-link").prop('class', 'nav-link disabled');
        var status = { "status": { "deleteFiles": true }};
        connection.send(JSON.stringify(status));
    });
});
