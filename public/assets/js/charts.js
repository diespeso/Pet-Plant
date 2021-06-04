$(function () {
  // jQuery methods go here...
  console.log('jquery enabled');
  // datos para tabla de temperatura
  const tempChart = $('#tempChart')[0].getContext('2d');
  new Chart(tempChart, {
    type: 'line',
    data: {
      labels: ['', '', '', '', '', '', '', ''],
      datasets: [
        {
          label: 'Temperatura',
          backgroundColor: 'rgb(190, 120, 29)',
          borderColor: 'rgb(190, 120, 29)',
          data: [0, 10, 5, 2, 20, 30, 45],
        },
      ],
    },
    options: {
      responsive: false,
    },
  });

  //   datos para tabla de humedad
  const humedadChart = $('#humedadChart')[0].getContext('2d');
  new Chart(humedadChart, {
    type: 'line',
    data: {
      labels: ['', '', '', '', '', '', '', ''],
      datasets: [
        {
          label: 'Humedad',
          backgroundColor: 'rgb(21, 163, 230)',
          borderColor: 'rgb(21, 163, 230)',
          data: [0, 10, 5, 2, 20, 30, 45],
        },
      ],
    },
    options: {
      responsive: false,
    },
  });

  //   datos para tabla de luz
  const luzChart = $('#luzChart')[0].getContext('2d');
  new Chart(luzChart, {
    type: 'line',
    data: {
      labels: ['', '', '', '', '', '', '', ''],
      datasets: [
        {
          label: 'Indice de Luz',
          backgroundColor: 'rgb(243, 208, 7)',
          borderColor: 'rgb(243, 208, 7)',
          data: [0, 10, 5, 2, 20, 30, 45],
        },
      ],
    },
    options: {
      responsive: false,
    },
  });
});
