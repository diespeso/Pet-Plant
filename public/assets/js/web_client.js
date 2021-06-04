//web_client.js
//cliente de página web, donde se muestra la webapp

//iniciar un websocket conectado a la direccion del servidor
var sock = new WebSocket('ws://192.168.1.64:80');

var anim = true;

function set_anim() {
  //demo quita la animacion
  document.getElementById('icono_planta').classList.remove('columpio_anim');
  myChart.datasets[''].pop();
  myChart.update();
  var ctx = document.getElementById('myChart').getContext('2d');
  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['', '', '', '', '', '', ''],
      datasets: [
        {
          label: 'temp',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: [10, 5, 2, 20, 30, 45],
        },
      ],
    },
    options: {
      responsive: false,
    },
  });
}

sock.onopen = function (event) {
  // comentar el siguiente objeto cuando se corra con la esp32, solo lo cree para probar con datos manuales
  var data = {
    temp: 24,
    humedad: 55,
    luz: 2,
    pir_live: 0,
    indice_luz: 1,
    indice_felicidad: 3,
  };
  //cuando se crea un cliente web app se presenta usando el socket al servidor
  sock.send('ok, connected');
  sock.addEventListener('message', function (event) {
    data = event.data;
    console.log(data);
    if (JSON.parse(data).pir_live == 1) {
      document.getElementById('close').textContent = 'no';
      document.getElementById('icono_planta').classList.add('columpio_anim');
    } else {
      document.getElementById('icono_planta').classList.remove('columpio_anim');
    }
    //aqui se actualiza el texto en el boton de la webapp(por ahora)
    //document.getElementById("close").textContent = message.data;
  });
  /* se manda llamar la funcion que modifica el icono segun los valores
  se la pasa como parametro el objeto que contiene dichos valores */
  changeData(data);
};

function dis() {
  //esta funcion se llama si se le da click al boton y no esta conectado, era de prueba
  return false;
}

// esta funcion modifica los iconos y la info segun los datos del objeto que se recibe desde la esp32
// se manda llamar en cada ocasion que el socket se active
const changeData = (data) => {
  console.log('si entra a funcion changeData'); //solo la puse para verificar que entra a la funcion xD

  /* valores sacados del objeto que se obtiene de la esp32 */
  let temp = data.temp;
  let humedad = data.humedad;
  let indice_luz = data.indice_luz;
  let indice_felicidad = data.indice_felicidad;

  // condiciones para cambiar imagen segun la humedad
  // solo cambia la imagen, ya que independientemente el valor, este siempre se muestra en texto
  // solo cambiar la imagen por el icono que corresponda si es que se van a cambiar
  if (humedad <= 20) {
    document.querySelector('#img_humedad').setAttribute('src', '/assets/img/Gota.svg');
  } else if (humedad <= 70) {
    document.querySelector('#img_humedad').setAttribute('src', '/assets/img/Gota.svg');
  } else {
    document.querySelector('#img_humedad').setAttribute('src', '/assets/img/Gota(Color).svg');
  }

  // condiciones para cambiar imagen segun la indice_luz
  if (indice_luz == 1) {
    document.querySelector('#img_luz').setAttribute('src', '/assets/img/Noche(Color).svg');
  } else if (indice_luz == 2) {
    document.querySelector('#img_luz').setAttribute('src', '/assets/img/Nublado(Color).svg');
  } else if (indice_luz == 3) {
    document.querySelector('#img_luz').setAttribute('src', '/assets/img/Sol(Color).svg');
  }

  // condiciones para cambiar imagen segun la carita feliz
  if (indice_felicidad == 1) {
    document
      .querySelector('#img_felicidad')
      .setAttribute('src', '/assets/img/CaritaPreocupada.svg');
  } else if (indice_felicidad == 2) {
    document.querySelector('#img_felicidad').setAttribute('src', '/assets/img/CaritaFeliz.svg');
  } else if (indice_felicidad == 3) {
    document.querySelector('#img_felicidad').setAttribute('src', '/assets/img/CaritaMuyFeliz.svg');
  }

  // se modifica el texto segun el valor
  document.querySelector('#texto_humedad').innerHTML = `${humedad}%`;
  document.querySelector('#texto_temp').innerHTML = `${temp}ºC`;
};
