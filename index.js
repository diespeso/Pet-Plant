//app.js
//programa servidor para el proyecto de planta mascota.

//modulos y constantes
var bodyParser = require("body-parser");
const express = require('express');
const app = express();

var http = require('http');
var path = require("path");
const WebSocketServer = require("ws/lib/websocket-server");

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const server = http.createServer(app); //se crea el server

//websocket
const WebSocket = require('ws');
const s = new WebSocket.Server({server}); //websocket creado usando el server
var clients = {
    esp32: Object(),
    page: Object(),
};

app.use(express.static(__dirname + '/public')); //se usan los archivos html y css de la carpeta public

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/index.html')); 
});

var temp = 0; //variable donde se guarda la temp que mande la esp32

s.on('connection', function(ws, req) { //evento: alguien se conecta al servidor
    console.log("conected: " + req.socket.remoteAddress); //mostrar su IP
    if(req.socket.remoteAddress == "192.168.1.70") {//si es la esp32
        console.log("Connected ESP32");
        clients.esp32 = ws;
        ws.on('message', function incoming(message) { //recibir los mensajes de la esp32
            console.log("ESP32: " + message);
            clients.esp32.send("ok, echo:" + message); //este mensaje lo manda el server a la esp32 como confirmacion
            if (Object.keys(clients.page) == 0) {
                console.log("page client not online") //si no hay un web client conectado
                return;
            } else {
                clients.page.send(message);
            }
            
        })

    } else { //si es un web client
        console.log("Connected web client at 192.168.1.83");
        clients.page = ws
        ws.on('message', function incoming(message) { //recibir mensajes del cliente web, aun no lo utilizo
            console.log("web client: " + message);
            ws.send(message);
        });
        ws.addEventListener('message', function(event) {//tampoco se utiliza aun, no se si sea útil en realidad, igual dejarlo
            console.log(event.data);
        });
        clients.page.send(32);
    }
    ws.on('close', function() { //si se desconecta un cliente
        console.log("lost one client");
    });
    s.on('message', function(message) {//tampoco se usa, creo. igual dejar
        if (message.data == "esp32 updated") {
            console.log("update received");
        }
    })
    console.log("new client connected");
});

server.listen(80, '192.168.1.83'); //ip y puerto del servidor
