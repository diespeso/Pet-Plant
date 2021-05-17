//app.js
//programa servidor para el proyecto de planta mascota.

//modulos y constantes
var bodyParser = require("body-parser");
const express = require('express');
const Datastore = require('nedb');
const app = express();

var http = require('http');
var path = require("path");
const WebSocketServer = require("ws/lib/websocket-server");



mensaje = null;

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

const log = new Datastore({filename: 'log.db'});
log.loadDatabase();

log.ensureIndex({fieldName: 'id', unique: true}, function(err){});

log.count({}, function(err, count) {
    id_actual = count;
});

app.use(express.static(__dirname + '/public')); //se usan los archivos html y css de la carpeta public

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/index.html')); 
});

var temp = 0; //variable donde se guarda la temp que mande la esp32

function actualizar_servidor() {
    log_datos();
    consultar_inmediato();
}

function log_datos() {
    log.insert({id: id_actual,
    temperatura: JSON.parse(mensaje).temp,
    tiempo: (new Date).toString().split(' ').slice(0, 5).join()});
}

function consultar_inmediato() {
    log.count({}, function(err, count) {
        id_actual = count;
    });
    /*
    log.find({id: {$lt: id_actual, $gt: id_actual - 6}}).sort({id: 1}).exec(function(err, docs) {
        console.log(docs);
    });*/
    log.find({id: {$lt: id_actual, $gt: id_actual - 6}}, function(err, docs) {
        console.log(docs);
    });
}

flag_primero = true;
flag_conectado_antes = false;

s.on('connection', function(ws, req) { //evento: alguien se conecta al servidor
    console.log("conected: " + req.socket.remoteAddress); //mostrar su IP
    if(req.socket.remoteAddress == "192.168.1.70") {//si es la esp32
        console.log("Connected ESP32");
        clients.esp32 = ws;
        if(!flag_conectado_antes) {
            setInterval(actualizar_servidor, 10000);
            flag_conectado_antes = true;
        }
        
        ws.on('message', function incoming(message) { //recibir los mensajes de la esp32
            
            console.log("ESP32: " + message);
            if(message != "Hi, im ESP32: ok.") {
                if(flag_primero) {
                    mensaje = message;
                    log_datos();
                    flag_primero = false;
                }
                mensaje = message;
                log.count({}, function(err, count) {
                    id_actual = count;
                });
            }
            
            clients.esp32.send("ok, echo:" + message); //este mensaje lo manda el server a la esp32 como confirmacion
            if (Object.keys(clients.page) == 0) {
                console.log("page client not online") //si no hay un web client conectado
                return;
            } else {
                clients.page.send(message);
            }
            
        })

    } else { //si es un web client
        //demo in
        
        //demo out
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
