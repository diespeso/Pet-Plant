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

//pines
 int gpio_dht_in = 4;
 
 int gpio_tierra_out = 5;
 int gpio_tierra_in = 34;
 
 int gpio_pir_in = 26;

 int gpio_foto_in = 35;

 //dht
 DHT dht(gpio_dht_in, DHTTYPE);

//red local
 const char* _SSID = "INFINITUMx5e2"; //esta es mi red de wifi
 const char* PASSWORD = "078603d626"; //mi clave, no me roben el wifi
 const uint16_t PORT = 80;
 const char* SERVER = "http://192.168.1.64:80"; //ip y puerto del cliente nodejs
//byte temp = 0; //este es el contador que envio, lo uso para pruebas, en realidad sera un sensor

 using namespace websockets;
 WebsocketsClient client;
 
 void onMessageCallback(WebsocketsMessage message) { //función que muestra los mensajes que se reciben desde el servidor
  Serial.print("Received: ");
  Serial.println(message.data());
  if (message.data() == "humedad") { //servidor pide sensar humedad
    Serial.println("petición sensar humedad");
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

 int sensar_humedad() { //enciende el sensor de humedad, sensa y se apaga
  //esto se hace porque el sensor se va dañando si se deja todo el tiempo ON
  //debido a que funciona por medio de electrólisis, la cual oxida los metales
  //https://lastminuteengineers.com/soil-moisture-sensor-arduino-tutorial/
  digitalWrite(gpio_tierra_out, HIGH);
  delay(10); //sin este delay la corriente no es suficiente para medir y da malos valores
  int tierra_in = analogRead(gpio_tierra_in);
  digitalWrite(gpio_tierra_out, LOW);
  Serial.print("humedad analog: "); //debug, pero no estorba
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
  int luz_lectura = analogRead(gpio_foto_in);
  int luz = (luz_lectura / 4095.0) * 100.0;
  if(mostrar) {
    Serial.print("temperatura: ");
    Serial.print(temp);
    Serial.println("*C");

    Serial.print("humedad: ");
    Serial.print(humedad);
    Serial.println("%");

    Serial.print("pir: ");
    Serial.println(pir);

    Serial.print("luz, analog: ");
    Serial.println(luz_lectura);
    Serial.print("luz %: ");
    Serial.println(luz);
  }
  DynamicJsonDocument json(1024);
  json["temp"] = temp;
  json["humedad"] = humedad;
  json["pir"] = pir;
  json["luz"] = luz;
  String out;
  serializeJson(json, out);
  return out;
 }
 


 void setup() {
  pinMode(gpio_tierra_in, INPUT);
  pinMode(gpio_tierra_out, OUTPUT);
  pinMode(gpio_pir_in, INPUT_PULLDOWN);
  Serial.begin(115200);
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
  client.ping();
    
  Serial.println("setup done.");
  delay(1000);
 }

void loop() {
  if (!client.ping("servidor?")) { //resistencia a desconexiones
     client.connect(SERVER);
     Serial.println("Conexión al servidor reestablecida");
  }
  client.poll();

  client.send(sensar(false, true)); //manda el json al servidor
  delay(500); //esto pasa 1 vez por segundo, aqui se ajustaria la frecuencia de actualizacion, probablemente sea mejor mas tiempo
}
