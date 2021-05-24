/* Programa cliente para planta mascota
 *  se conecta a un servidor node.js para enviarle
 *  la información de humedad y sensor de movimiento
 *  de la planta cada cierto tiempo.
 * */

 #include "WiFi.h"
 #include <ArduinoWebsockets.h>
 #include <ArduinoJson.h>
 #include "DHT.h"

 #define DHTTYPE DHT11

 int gpio_dht_in = 4;
 
 int gpio_tierra_out = 5;
 int gpio_tierra_in = 34;
 int c_tierra = 10; //cuantos ticks antes de sensar tierra
 const int T_TIERRA = 10; //cauntos ticks antes de sensar tierra
 
 int gpio_pir_in = 26;
 
 DHT dht(gpio_dht_in, DHTTYPE);

 const char* _SSID = "INFINITUMx5e2"; //esta es mi red de wifi
 const char* PASSWORD = "078603d626"; //mi clave, no me roben el wifi
 const uint16_t PORT = 80;
 const char* SERVER = "http://192.168.1.83:80"; //ip y puerto del cliente nodejs
//byte temp = 0; //este es el contador que envio, lo uso para pruebas, en realidad sera un sensor

 using namespace websockets;
 WebsocketsClient client;
 
 void onMessageCallback(WebsocketsMessage message) { //función que muestra los mensajes que se reciben desde el servidor
  Serial.print("Received: ");
  Serial.println(message.data());
  if (message.data() == "humedad") { //servidor pide sensar humedad
    Serial.println("peticiónsensar humedad");
    client.send(sensar(true, true));
  }
 }

 void onEventsCallback(WebsocketsEvent event, String data) {
  if(event == WebsocketsEvent::ConnectionOpened) { //cuando se conecta
    Serial.println("Connection opened.");
  } else if(event == WebsocketsEvent::ConnectionClosed) { //cuando se desconecta
    Serial.println("Connection closed.");
  }
 }

 int sensar_humedad() {
  digitalWrite(gpio_tierra_out, HIGH);
  delay(10); //sin este delay la corriente no es suficiente para medir
  int tierra_in = analogRead(gpio_tierra_in);
  digitalWrite(gpio_tierra_out, LOW);
  Serial.print("humedad analog: ");
  Serial.println(tierra_in);
    
  return (int)((1.0 - tierra_in / 4095.0) * 100.0); //convertir a porcentaje
 }

 String sensar(bool on_demand, bool mostrar) {
  //si on_demand es true, sensar humedad, sino sensar todo lo demas
  //que se monitorea cada ciclo de la esp32
  //si mostrar es true, se mandan a serial las mediciones
  int temp = (int)dht.readTemperature();
  int humedad = -1;
  if(on_demand) {
    humedad = sensar_humedad();
  }
  int pir = digitalRead(gpio_pir_in);
  if(mostrar) {
    Serial.print("temperatura: ");
    Serial.print(temp);
    Serial.println("*C");

    Serial.print("humedad: ");
    Serial.print(humedad);
    Serial.println("%");

    Serial.print("pir: ");
    Serial.println(pir);
  }
  DynamicJsonDocument json(1024);
  json["temp"] = temp;
  json["humedad"] = humedad;
  json["pir"] = pir;
  String out;
  serializeJson(json, out);
  return out;
 }
 


 void setup() {
  pinMode(gpio_tierra_in, INPUT);
  pinMode(gpio_tierra_out, OUTPUT);
  pinMode(gpio_pir_in, INPUT);
  Serial.begin(115200);
  //pinMode(gpio_dht_in, INPUT);
  dht.begin();
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
  delay(1000);
 }

DynamicJsonDocument doc(1024);

void loop() {
  if (!client.ping("servidor?")) {
     client.connect(SERVER);
     Serial.println("Conexión al servidor reestablecida");
  }
  client.poll();
  /*int temp = (int)dht.readTemperature();
  int humedad = -1;
  humedad = sensar_humedad();
  int pir = digitalRead(gpio_pir_in);
  Serial.println(c_tierra);
  Serial.print("temperatura: ");
  Serial.println(temp);
  Serial.print("% humedad: ");
  Serial.println(humedad);
  Serial.print("pir mov: ");
  Serial.println(pir);
  doc["temp"] = temp; //escribir el json a mandar
  doc["humedad"] = humedad;
  doc["pir"] = pir;
  //temp +=1; //aumentar el contador (solo es para pruebas)
  String out;
  serializeJson(doc, out); //serializar el json*/
  client.send(sensar(false, true)); //manda el json al servidor
  c_tierra -= 1;
  delay(500); //esto pasa 1 vez por segundo, aqui se ajustaria la frecuencia de actualizacion, probablemente sea mejor mas tiempo
}
