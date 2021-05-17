int pir_in = 2;
void setup() {
  pinMode(pir_in, INPUT);
  Serial.begin(9600);

}

void loop() {
  int val = digitalRead(pir_in);
  Serial.println(val);
  if(val == HIGH) {
    Serial.println("Movimiento detectado!");
  }
  delay(500);
}
