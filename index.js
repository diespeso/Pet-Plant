//app.js
//programa servidor para el proyecto de planta mascota.










//TODO: asegurarse de que siempre se mandan mensajes correctos al server






//modulos y constantes
var bodyParser = require("body-parser");
const express = require('express');
const Datastore = require('nedb');
const app = express();

var http = require('http');
var path = require("path");
const WebSocketServer = require("ws/lib/websocket-server");

const INTERVALO_ACTUALIZACION = 10; //cada cuantos mensajes de la esp32 se hace un log / se actuakuza el server.
var c_logging = INTERVALO_ACTUALIZACION;
var c_pir = 0; //contador de cuantas veces se activo el pir entre cada actualización del server

mensaje = null;

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const server = http.createServer(app); //se crea el server

//websocket
const WebSocket = require('ws');
const s = new WebSocket.Server({server}); //websocket creado usando el server
var clients = { //el server 
    esp32: Object(),
    page: Object(), //cliente web app, por facilidad solo se permitirá uno conectado
};

const log = new Datastore({filename: 'log.db'}); //abrir la bd
log.loadDatabase(); //cargar bd

log.ensureIndex({fieldName: 'id', unique: true}, function(err){}); //indexar por id

log.count({}, function(err, count) { //se inicia el id al total de inserciones, si hay 1, entonces el id es 1 ya que el anterior era 0
    id_actual = count;
});

app.use(express.static(__dirname + '/public')); //se usan los archivos html y css de la carpeta public

app.get('/', function(req, res){ //punto de entrada?, directamente mostrar index.html
    res.sendFile(path.join(__dirname + '/index.html')); 
});

function actualizar_servidor() {
    log_datos();
    consultar_inmediato();
    c_pir = 0; //cada vez que se actualiza, se vuelven a contar las interacciones pir
}

var anteriores;
function calcular_indices() {
    var indices = {};
    humedades = [];
    log.count({}, function(err, count) {
        id_actual = count;
    });

    //consultar logs de la ultima hora: 6 logs
    log.find({id: {$lte: id_actual, $gt: id_actual - 6}}, function(err, docs) { //query de nedb para obtener los últimos 6 logs, probs terminen siendo 5: 1hr.
        anteriores = docs;
    });
    //si se consultaron bien
    if(anteriores) {
        console.log("anteriores ok");
        if(anteriores.length == 6) { //solo si ya tenemos una hora registrada: 6 logs
            for(var i = 0; i < anteriores.length; i++) {
                humedades.push(anteriores[i].humedad);
            }
            
            indices.humedad = calcular_indice_humedad(humedades);
        }
    }
    console.log("indices internos:");
    console.log(indices);
    return indices;
}

function calcular_indice_humedad(humedades) {
    //se calcula una media ponderada dándole más peso a las lecturas más recientes.
    pesos = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2];
    humedades_procesadas = [0, 0, 0, 0, 0, 0];
    sumatoria = 0.0;
    for(var i = 0; i < humedades.length; i++) {
        humedades_procesadas[i] = humedades[i] * pesos[i];
        sumatoria += humedades_procesadas[i];
    }
    return sumatoria / 6.0;
}

var mensaje;
function generar_mensaje_webapp(mensaje_500ms) {
    if(mensaje_500ms) {
        mensaje = mensaje_500ms;
        if(JSON.parse(mensaje_500ms).humedad != -1) {
            indices = calcular_indices();
            mensaje = JSON.parse(mensaje_500ms);
            console.log("indices:");
            console.log(indices);
            mensaje.humedad = indices.humedad;
            //console.log(mensaje);
            return JSON.stringify(mensaje, null, 2);
        }
        mensaje = JSON.parse(mensaje_500ms);
        mensaje.luz = 0;
        mensaje.pir_live = mensaje.pir;
        mensaje.humedad = null;
        mensaje.indice_luz = null;
        mensaje.indice_felicidad = null;
        return JSON.stringify(mensaje);
    }
    
}

function log_datos() {
    //mete la lectura de los sensores desde la esp32 a la bd
    log.insert({id: id_actual,
    temperatura: JSON.parse(mensaje).temp,
    humedad: JSON.parse(mensaje).humedad,
    pir: c_pir, //contador de interacciones
    tiempo: (new Date).toString().split(' ').slice(0, 5).join()});
}

function consultar_inmediato() { //consulta los ultimos n logs
    //esta funcion se usará para obtener los coeficientes de cada icono mostrado en frontend
    //TODO: proponer un algoritmo o fórmula para sacar coeficiente de felicidad y dependientes.
    log.count({}, function(err, count) {
        id_actual = count;
    });

    log.find({id: {$lte: id_actual, $gt: id_actual - 6}}, function(err, docs) { //query de nedb para obtener los últimos 6 logs, probs terminen siendo 5: 1hr.
        //console.log(docs);
    });
}

flag_primero = true; //primer mensaje?
flag_conectado_antes = false; //reconexión?

s.on('connection', function(ws, req) { //evento: alguien se conecta al servidor
    console.log("conected: " + req.socket.remoteAddress); //mostrar su IP
    if(req.socket.remoteAddress == "192.168.1.70") {//si es la esp32
        console.log("Connected ESP32");
        clients.esp32 = ws;
        
        ws.on('message', function incoming(message) { //recibir los mensajes de la esp32
            
            console.log("ESP32: " + message); //mostrar mensaje recibido
            if(message != "Hi, im ESP32: ok.") {
                mensaje = message;
                if(flag_primero) { //la primer lectura en cuanto se conecta la esp32 siempre se toma en cuenta
                    if(JSON.parse(mensaje).temp < 100) { //al inicializarse da valores nan: de un max, los cuales son basura
                        //asi que utilizo esto para no registrar nada hasta que la esp32 se estabilice.
                        flag_primero = false;
                        clients.esp32.send("humedad");
                        //log_datos();
                        
                    }
                    
                }
                if(JSON.parse(mensaje).humedad != -1) { //humedad monitoreada, on demand?
                    if(JSON.parse(mensaje).temp < 100) { //ignorar si es lectura rara de inicio de esp32
                        actualizar_servidor();
                    }               
                }

                if(JSON.parse(mensaje).pir == 1) { //contabilizar interacciones pir
                    c_pir++;
                }
                if(c_logging == 0) { //hacer logging cuando se cumpla el intervalo
                    c_logging = INTERVALO_ACTUALIZACION;
                    clients.esp32.send("humedad"); //este mensaje hará que la esp32 responda con un mensaje que
                    //contiene un valor de humedad válido, entonces de forma indirecta actualiza el servidor.                    
                    
                }
                log.count({}, function(err, count) { //actualizar el id_actual
                    id_actual = count;
                });
                c_logging -= 1; //actualizar contador de logs faltantes para actualizar servidor
            }
            
            clients.esp32.send("ok, echo:" + message); //este mensaje lo manda el server a la esp32 como confirmacion
            if (Object.keys(clients.page) == 0) {
                console.log("page client not online") //si no hay un web client conectado
                return;
            } else { //enviar el mensaje de la esp32 al cliente webapp: como un puente
                /*console.log("mensaje: ");
                console.log(mensaje);*/
                clients.page.send(generar_mensaje_webapp(mensaje)); //FIX: si genero aqui, entonces solo se calculan cuando la webapp esta on, cambiar
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
        //clients.page.send(32);
    }
    ws.on('close', function() { //si se desconecta un cliente
        console.log("cliente desconectado");
    });
    s.on('message', function(message) {//tampoco se usa, creo. igual dejar
        if (message.data == "esp32 updated") {
            console.log("update received");
        }
    })
    console.log("new client connected");
});

server.listen(80, '192.168.1.83'); //ip y puerto del servidor
