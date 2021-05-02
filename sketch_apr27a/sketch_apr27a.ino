void setup() {
  // put your setup code here, to run once:
  pinMode(3, OUTPUT);
  pinMode(5, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:
  analogWrite(3, 200);
  analogWrite(5, 50);
  analogWrite(6, 100);
  delay(1000);
  analogWrite(3, 0);
  analogWrite(6, 0);
  Serial.print("ok");
  
  delay(1000);
}
