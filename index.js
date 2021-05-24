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

const INTERVALO_LOGGING = 6; //cada cuantos mensajes de la esp32 se hace logging, para mantener sync con la esp32 no se usa tiempo ya
var c_logging = INTERVALO_LOGGING;
var c_pir = 0;

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
    c_pir = 0;
}

function log_datos() {
    log.insert({id: id_actual,
    temperatura: JSON.parse(mensaje).temp,
    humedad: JSON.parse(mensaje).humedad,
    pir: c_pir, //contador de interacciones
    tiempo: (new Date).toString().split(' ').slice(0, 5).join()});
}

function consultar_inmediato() { //consulta los ultimos n logs
    log.count({}, function(err, count) {
        id_actual = count;
    });
    /*
    log.find({id: {$lt: id_actual, $gt: id_actual - 6}}).sort({id: 1}).exec(function(err, docs) {
        console.log(docs);
    });*/
    log.find({id: {$lte: id_actual, $gt: id_actual - 6}}, function(err, docs) {
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

        //se dejo de usar porque ahora la esp32 es el reloj de todo el sistema
        /*if(!flag_conectado_antes) {
            setInterval(actualizar_servidor, intervalo_logging);
            flag_conectado_antes = true;
        }*/
        
        ws.on('message', function incoming(message) { //recibir los mensajes de la esp32
            
            console.log("ESP32: " + message);
            if(message != "Hi, im ESP32: ok.") {
                if(flag_primero) { //la primer lectura en cuanto se conecta la esp32 siempre se toma en cuenta
                    mensaje = message;
                    if(JSON.parse(mensaje).temp < 100) { //al inicializarse da valores nan: de un max, los cuales son basura
                        //asi que utilizo esto para no registrar nada hasta que la esp32 se estabilice.
                        log_datos();
                        flag_primero = false;
                    }
                    
                }
                mensaje = message;
                if(JSON.parse(mensaje).humedad != -1) {
                    if(JSON.parse(mensaje).temp < 100) { //ignorar si es lectura rara de inicio de esp32
                        actualizar_servidor();
                    }
                    
                }
                if(JSON.parse(mensaje).pir == 1) {
                    c_pir++;
                }
                if(c_logging == 0) { //hacer logging cuando se cumpla el intervalo
                    c_logging = INTERVALO_LOGGING;
                    clients.esp32.send("humedad");                    
                    
                }
                log.count({}, function(err, count) {
                    id_actual = count;
                });
                c_logging -= 1;
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
