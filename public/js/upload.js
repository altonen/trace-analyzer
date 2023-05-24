// Parts of the code from here have been taken from https://github.com/ultravideo/cloud-encoder
// which is licensed under BSD-2.

// if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;

var fileID = null;
var fileName = null;
var connection = null;
var websocketAddr = document.location.host;

function websocketOpenListener() {
    $("#server_conn").hide();
    $("#upload_file").show();
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

    console.log('send message', message_data);

    if ("noFiles" in message_data["status"]) {
        if (message_data["status"]["noFiles"] === false) {
            $("#tab2-link").prop('class', 'nav-link');
            $("#tab30-link").prop('class', 'nav-link');
            $("#delete_files").show();
        }
    }

    if ("filesDeleted" in message_data["status"]) {
        $("#delete_files").prop('class', 'btn btn-danger disabled');
    }

    if ("analysisReady" in message_data["status"]) {
        $("#tab2-link").prop('class', 'nav-link');
        $("#tab30-link").prop('class', 'nav-link');
        $("#delete_files").show();
        $('#file_status').hide();
    }
}

function websocketCloseListener(error) {
    console.log("connection closed...");        
    $("#server_conn").show();
    $("#upload_file").hide();
    setTimeout(connectWebsocket, 1000, websocketAddr);    
}

function websocketErrorListener(error) {
    $("#server_conn").hide();
    $("#upload_file").show();
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
            return
        }
    }

    connection = new WebSocket(('https:' == document.location.protocol ? 'wss' : 'ws') + '://' + addr);  

    connection.addEventListener('open',websocketOpenListener);
    connection.addEventListener('message',websocketMessageListener);
    connection.addEventListener('close',websocketCloseListener);
    connection.addEventListener('error',websocketErrorListener);
}

$(document).ready(function() {
    connectWebsocket(websocketAddr);

    $("#tab2-link").prop('class', 'nav-link disabled');
    $("#tab30-link").prop('class', 'nav-link disabled');

    $('#delete_files').click(function() {
        $("#tab2-link").prop('class', 'nav-link disabled');
        $("#tab30-link").prop('class', 'nav-link disabled');
        var status = { "status": { "deleteFiles": true }};
        connection.send(JSON.stringify(status));
    });

    $('#fileInput').change(function() {
        console.log("change status to enabled");
        $('#upload_file').prop('class', 'btn btn-primary');
    });

    $('#upload_file').click(function() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        const formData = new FormData();
        formData.append('file', file);

        $('#file_text').html("Uploading file...");
        $('#file_status').show();
        $('#upload_file').prop('class', 'btn btn-primary disabled');

        fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (response.ok) {
                console.log('File uploaded successfully.');
                $('#file_text').html("Analyzing file...");
                $('#file_status').show();
            } else {
                throw new Error('File upload failed.');
            }
        })
        .catch(error => {
        console.error(error);
        });
    });
});
