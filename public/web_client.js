//web_client.js
//cliente de página web, donde se muestra la webapp

//iniciar un websocket conectado a la direccion del servidor
var sock = new WebSocket("ws://192.168.1.83:80");

function set_anim() {
  var uwu = 3; //estaba probando el activar las animaciones en css, no funciona, pero es cosa de html-css
  if(uwu == 3) {
    document.getElementById("water-meter").classList.add("animated-caricia")
  }
}

sock.onopen = function(event) { //cuando se crea un cliente web app se presenta usando el socket al servidor
    sock.send("ok, connected");
    sock.addEventListener('message', function(event) {
  document.getElementById("close").textContent = event.data; //aqui se actualiza el texto en el boton de la webapp(por ahora)
});
}
function dis() { //esta funcion se llama si se le da click al boton y no esta conectado, era de prueba
  document.getElementById("close").textContent = "no";
  set_anim();
  return false;
}



