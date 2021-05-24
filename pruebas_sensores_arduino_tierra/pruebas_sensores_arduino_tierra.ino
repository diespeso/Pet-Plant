int suelo_cont = 0;
int suelo_in = A0;
int suelo_trigger = 2;
void setup() {
  pinMode(suelo_in, INPUT);
  pinMode(suelo_trigger, OUTPUT);
  Serial.begin(9600);

}

void loop() {
  if(suelo_cont == 2) {
    digitalWrite(suelo_trigger, HIGH);
    delay(10);
    Serial.println(analogRead(suelo_in));
    digitalWrite(suelo_trigger, LOW);
    suelo_cont = 0;
  }
  suelo_cont += 1;
  delay(1000);
}
