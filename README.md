<h4 align="center">
PET-PLANT: PROJECT
</h4>
<br />

### Inicio Rápido

- Instalar dependencias corriendo comando `yarn` or `npm install`
- Correr comando `yarn dev` o `npm dev`, _ya esta predefinido que el comando corra como sudo_

<br />

### Cambios en la estructura anterior

- Se cambió un poco la estructura de archivos para darle mas organizacion
- Ya no se usó react, todo se renderiza desde el server por lo que la pagina debe recargarse al cambiar de ruta
- Archivos JS estan en src/assets/js
- Estilos en src/styles.css
- Iconos en folder src/assets/img
- Se cambió la estructura del index con la nueva interfaz
- Se creo otro html con la interfaz de las graficas (el with se toma de la hoja de estilos)
- Se agregó la ruta /graficas en index.js linea 53
- Se dejaron comentarios en web_client.js

<br />

### Informacion

#### dependencias de nodejs

Basta con correr el comando `npm install` o `yarn` y se instalan las dependencias que estan en el archivo package.json

- ws
- express
- nedb
- nodemon

servidor: Node.js

para cargar código a la esp32 añadir este gestor de tarjetas a Arduino IDE:
https://dl.espressif.com/dl/package_esp32_index.json

#### dependencias de Arduino IDE:

- ArduinoWebsockets.h
- ArduinoJson.h
- DTH library by Adafruit

### Correr Server

#### `yarn dev` o `npm dev`

Correr comando `yarn dev` o `npm dev`, _ya esta predefinido que el comando corra como sudo_

<br />
