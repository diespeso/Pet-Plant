int suelo_cont = 0;
int suelo_in = A0;
int suelo_trigger = 2;
void setup() {
  pinMode(suelo_in, INPUT);
  pinMode(suelo_trigger, OUTPUT);
  Serial.begin(9600);

}

void loop() {
  if(suelo_cont == 10) {
    digitalWrite(suelo_trigger, HIGH);
    Serial.println(analogRead(suelo_in));
    suelo_cont = 0;
  }
  suelo_cont += 1;
  delay(1000);
}
