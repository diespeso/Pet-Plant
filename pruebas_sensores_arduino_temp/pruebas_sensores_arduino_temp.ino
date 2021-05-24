#include <SimpleDHT.h>

int dht_in = 2;
SimpleDHT11 dht11(dht_in);
void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.print("temp: ");
  byte temp = 0;
  byte humedad = 0;
  dht11.read(&temp, NULL, NULL);
  Serial.println((int)temp);
  delay(500);
}
