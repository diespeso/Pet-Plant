/* Programa cliente para planta mascota
 *  se conecta a un servidor node.js para enviarle
 *  la información de humedad y sensor de movimiento
 *  de la planta cada cierto tiempo.
 * */

 #include "WiFi.h"
 #include <ArduinoWebsockets.h>
 #include <ArduinoJson.h>

 const char* _SSID = "INFINITUMx5e2"; //esta es mi red de wifi
 const char* PASSWORD = "078603d626"; //mi clave, no me roben el wifi
 const uint16_t PORT = 80;
 const char* SERVER = "http://192.168.1.83:80"; //ip y puerto del cliente nodejs
 int temp = 11; //este es el contador que envio, lo uso para pruebas, en realidad sera un sensor

 using namespace websockets;

 
 void onMessageCallback(WebsocketsMessage message) { //función que muestra los mensajes que se reciben desde el servidor
  Serial.print("Received: ");
  Serial.println(message.data());
 }

 void onEventsCallback(WebsocketsEvent event, String data) {
  if(event == WebsocketsEvent::ConnectionOpened) { //cuando se conecta
    Serial.println("Connection opened.");
  } else if(event == WebsocketsEvent::ConnectionClosed) { //cuando se desconecta
    Serial.println("Connection closed.");
  }
 }


WebsocketsClient client;

 void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  delay(100);

  WiFi.begin(_SSID, PASSWORD);
  while(WiFi.status() != WL_CONNECTED) { //esperar a que se conecte, no es instantaneo
    Serial.printf("trying to connect to %s...\n", _SSID);
    delay(500);
  }

  IPAddress ipAddress = WiFi.localIP(); //IP asignada a la esp32
  Serial.printf("Connected to %s network with ip %d.%d.%d.%d\n", _SSID,
    ipAddress[0], ipAddress[1], ipAddress[2], ipAddress[3]);
    
  //establecer las funciones 
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);
    
  client.connect(SERVER);
  client.send("Hi, im ESP32: ok."); //presentarse en el server
  client.ping(); //no se que haga, pero hay que dejarlo jeje, creo que no hace nada
    
  Serial.println("setup done.");
 }

DynamicJsonDocument doc(1024);
void loop() {
  client.poll();
  doc["temp"] = temp; //escribir el json a mandar
  temp +=1; //aumentar el contador (solo es para pruebas)
  String out;
  serializeJson(doc, out); //serializar el json
  client.send(out); //manda el json al servidor
  delay(1000); //esto pasa 1 vez por segundo, aqui se ajustaria la frecuencia de actualizacion, probablemente sea mejor mas tiempo
}
