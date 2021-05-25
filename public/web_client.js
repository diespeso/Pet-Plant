//web_client.js
//cliente de página web, donde se muestra la webapp

//iniciar un websocket conectado a la direccion del servidor
var sock = new WebSocket("ws://192.168.1.83:80");

var anim = true;

function set_anim() { //demo quita la animacion
  document.getElementById("icono_planta").classList.remove("columpio_anim");
  myChart.datasets[""].pop();
  myChart.update();
  var ctx = document.getElementById('myChart').getContext('2d');
  myChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: ["", "", "", "", "", "", ""],
		datasets: [{
			label: 'temp',
			backgroundColor: 'rgb(255, 99, 132)',
      		borderColor: 'rgb(255, 99, 132)',
     		data: [10, 5, 2, 20, 30, 45],
		}]
	},
	options: {
		responsive: false,
	}
});

}

sock.onopen = function(event) { //cuando se crea un cliente web app se presenta usando el socket al servidor
    sock.send("ok, connected");
    sock.addEventListener('message', function(event) {
      console.log(event.data);
      if(JSON.parse(event.data).pir == 1) {
        document.getElementById("close").textContent = "no";
        document.getElementById("icono_planta").classList.add("columpio_anim");
      } else {
        document.getElementById("icono_planta").classList.remove("columpio_anim");
      }
  //document.getElementById("close").textContent = message.data; //aqui se actualiza el texto en el boton de la webapp(por ahora)
});
}
function dis() { //esta funcion se llama si se le da click al boton y no esta conectado, era de prueba
  return false;
}



