# Arkana TCG — App móvil

App móvil (React Native) del juego de cartas coleccionables **Arkana TCG**. Combina **cartas físicas con chip NFC** con un entorno digital competitivo: se escanean las cartas con el celular, se guardan en una galería personal y se usan para pelear batallas **1 vs 1** en línea.

El servidor vive en el repositorio [`arkana-backend`](https://github.com/ProyectoArkana/arkana-backend); esta app **necesita que el backend esté corriendo** para funcionar.

> Alcance actual: **prototipo (MVP)**. Solo Android está configurado y probado.

---

## Tabla de contenido

1. [Qué hace la app](#qué-hace-la-app)
2. [Tecnologías](#tecnologías)
3. [Requisitos](#requisitos)
4. [Instalación paso a paso](#instalación-paso-a-paso)
5. [Conectar la app con el backend](#conectar-la-app-con-el-backend)
6. [Túneles y puertos](#túneles-y-puertos)
7. [Ejecución](#ejecución)
8. [Cómo probar el juego completo](#cómo-probar-el-juego-completo)
9. [Scripts y calidad de código](#scripts-y-calidad-de-código)
10. [Estructura del proyecto](#estructura-del-proyecto)
11. [Solución de problemas](#solución-de-problemas)
12. [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)

---

## Qué hace la app

| Pantalla | Función |
|---|---|
| **Login / Registro** | Crea una cuenta o inicia sesión. La sesión (JWT) se guarda de forma segura en el Keychain/Keystore del dispositivo. |
| **Galería** | Muestra las cartas que has escaneado, con su ilustración y estadísticas (HP, ataque, defensa, velocidad, maná y habilidad). Se guarda en tu cuenta, así que la ves igual desde cualquier dispositivo. |
| **Escanear carta** | Acercas una carta física al celular. El servidor valida el chip (¿es una carta real de Arkana?), la devuelve y la desbloquea en tu galería. |
| **Arena** | Entrada al matchmaking: te conecta con otro jugador en una sala 1 vs 1. |
| **Pick** | Escaneas las **5 cartas** de tu equipo para la batalla. El equipo es efímero (no se guarda). |
| **Batalla** | Turnos simultáneos: **atacar**, **cambiar de carta** (switch) o usar un **escudo** (2 por partida). Gana quien deja a las 5 cartas rivales sin HP. |
| **Perfil** | Victorias, derrotas e historial de partidas. |

Las cartas **no tienen dueño**: se pueden prestar. Cualquier jugador puede escanear y usar la carta de otro.

La app **no calcula nada del combate**: solo envía lo que el jugador quiere hacer y dibuja el estado que manda el servidor.

---

## Tecnologías

| Área | Librería |
|---|---|
| Framework | React Native **0.87** · React 19 · TypeScript |
| Navegación | React Navigation (stack + pestañas inferiores) |
| Estado | Zustand (sesión) |
| HTTP | Axios (con interceptor de JWT) |
| Tiempo real | Socket.IO Client |
| NFC | `react-native-nfc-manager` |
| Almacenamiento seguro | `react-native-keychain` |
| Calidad | ESLint · Prettier · Jest · `tsc` |

---

## Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| Node.js | **22.11 o superior** | Lo exige `package.json` (`engines`). |
| npm | 10 o superior | |
| JDK | **17** | Requerido por el build de Android. |
| Android Studio | reciente | Incluye el SDK y `adb`. Instala también un SDK de Android reciente y las *Platform-Tools*. |
| Celular Android **con NFC** | Android 8+ | Con **depuración USB** activada. El emulador no lee tarjetas NFC. |
| Backend corriendo | — | Ver el README de `arkana-backend`. |

Variables de entorno de Android (agrégalas a `~/.bashrc` o `~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Comprueba que todo está disponible:

```bash
node -v && java -version && adb version
```

Si algo falla con el entorno, sigue la guía oficial: <https://reactnative.dev/docs/set-up-your-environment> (pestaña *React Native CLI* → *Android*).

---

## Instalación paso a paso

```bash
# 1. Clonar
git clone https://github.com/ProyectoArkana/ArkanaMobile.git
cd ArkanaMobile

# 2. Instalar dependencias
npm install

# 3. Verificar que el celular está conectado y autorizado
adb devices
#    Debe aparecer tu dispositivo con el estado "device".
#    Si dice "unauthorized", acepta el mensaje de depuración USB en el celular.
```

---

## Conectar la app con el backend

Toda la app habla **únicamente con el API Gateway (puerto 3000)** del backend, tanto REST como WebSockets. La dirección se configura en **`src/api/config.ts`**:

```ts
const HOST = '192.168.50.249';   // <-- cámbialo
```

Elige **una** de estas dos formas:

### Opción A — USB con `adb reverse` (recomendada)

El celular "ve" el puerto de tu PC como si fuera suyo. No depende de la red ni del firewall.

```ts
const HOST = 'localhost';
```
```bash
adb reverse tcp:3000 tcp:3000
```

### Opción B — Wi-Fi

El celular y la PC deben estar en la **misma red**.

1. Obtén la IP de tu PC: `hostname -I` (Linux) · `ipconfig getifaddr en0` (Mac) · `ipconfig` (Windows).
2. Ponla en `HOST`, por ejemplo `const HOST = '192.168.1.45';`.
3. Permite el puerto en el firewall: `sudo ufw allow 3000/tcp`.

> La app permite tráfico HTTP sin cifrar (`usesCleartextTraffic`) para desarrollo. Para producción hay que usar **HTTPS/WSS**.

---

## Túneles y puertos

| Puerto | Qué es | Cuándo hace falta |
|---|---|---|
| **3000** | API Gateway del backend (REST + WebSockets) | **Siempre.** Con la Opción A: `adb reverse tcp:3000 tcp:3000`. Con la Opción B no se necesita túnel. |
| **8081** | Metro (servidor de JavaScript de React Native) | Lo conecta `npm run android` automáticamente. Si la app muestra pantalla roja de "unable to load script", hazlo a mano: `adb reverse tcp:8081 tcp:8081`. |

Resumen para trabajar por USB:

```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

Los túneles se pierden al desconectar el cable o reiniciar `adb`; si la app deja de conectar, vuelve a ejecutarlos. Se pueden revisar con `adb reverse --list`.

**Demo fuera de tu red**: usa un túnel público al puerto 3000 del backend (`ngrok http 3000` o `cloudflared tunnel --url http://localhost:3000`) y cambia `GATEWAY` en `src/api/config.ts` por la URL `https` que entregue. Ambos soportan WebSockets.

---

## Ejecución

Necesitas **dos terminales** (con el backend ya corriendo en otra):

```bash
# Terminal 1 — servidor de desarrollo (Metro)
npm start

# Terminal 2 — compila e instala la app en el celular
npm run android
```

La primera compilación tarda varios minutos (Gradle descarga dependencias). Después, los cambios en el código se reflejan al instante (*Fast Refresh*) sin recompilar.

Orden recomendado de arranque completo:

1. Base de datos: `docker compose up -d` (en `arkana-backend`).
2. Backend: `npm run dev` (en `arkana-backend`).
3. Túneles: `adb reverse tcp:3000 tcp:3000` (si usas USB).
4. Metro: `npm start`.
5. App: `npm run android`.

---

## Cómo probar el juego completo

**Requisitos de la prueba**

- Celular con **NFC activado** (Ajustes → Conexiones → NFC).
- Las cartas físicas registradas en el backend (`seed-cartas.sql`; ver el README del backend).
- Para una **batalla** hacen falta **dos jugadores en dos dispositivos**, cada uno con su cuenta y 5 chips distintos. Con un solo celular puedes probar registro, galería y escaneo, pero no una partida completa.

**Recorrido**

1. Crea una cuenta en **Registro** (queda con la sesión iniciada).
2. En **Galería** → **Escanear carta**, acerca una carta al reverso del celular. Debe aparecer con sus estadísticas y quedar guardada.
3. En **Arena** → **Buscar partida**. Cuando el otro jugador también busque, se emparejan.
4. En **Pick**, escanea 5 cartas distintas y confirma tu equipo.
5. En **Batalla**, cada turno elige **atacar**, **escudo** o **cambiar de carta**. El turno se resuelve cuando ambos eligieron.
6. Al terminar, tu **Perfil** muestra la victoria o derrota en el historial.

**Reglas que verás en pantalla**

- Atacar cuesta **maná**; si no alcanza, el botón se deshabilita.
- Tienes **2 escudos** por partida; bloquean todo el daño de ese turno.
- Si una carta cae, debes elegir otra de tu banca.
- Si pierdes conexión, tienes 30 segundos para volver antes de perder la partida.

---

## Scripts y calidad de código

| Comando | Descripción |
|---|---|
| `npm start` | Inicia Metro. |
| `npm run android` | Compila e instala en Android. |
| `npm run lint` | ESLint sobre todo el proyecto. |
| `npx tsc --noEmit` | Verifica los tipos de TypeScript. |
| `npm test` | Pruebas con Jest. |

El **CI** (`.github/workflows/ci.yml`) se ejecuta en cada *push* y *Pull Request* hacia `main` y `develop`: instala con `npm ci`, ejecuta ESLint y `tsc`, y después las pruebas de Jest. Conviene correr los tres comandos en local antes de subir cambios.

---

## Estructura del proyecto

```
ArkanaMobile/
├── App.tsx
├── index.js
├── android/                   # Proyecto nativo Android (permiso NFC declarado)
├── __tests__/                 # Pruebas Jest
└── src/
    ├── api/
    │   ├── config.ts          # Dirección del backend (HOST) y paths de WebSocket
    │   ├── client.ts          # Axios con JWT e interceptor de sesión vencida
    │   └── errors.ts          # Mensajes de error del backend
    ├── components/
    │   └── CardView.tsx       # Carta con sus estadísticas y habilidad
    ├── hooks/
    │   └── useMatchSocket.ts  # Conexión de la batalla (Socket.IO)
    ├── navigation/            # Rutas y pestañas
    ├── screens/
    │   ├── LoginScreen.tsx · RegisterScreen.tsx
    │   ├── GalleryScreen.tsx  # Cartas escaneadas
    │   ├── NfcScanScreen.tsx  # Escanear una carta
    │   ├── ArenaScreen.tsx · MatchmakingScreen.tsx
    │   ├── MatchScreen.tsx    # Contenedor de la partida
    │   ├── match/PickPhase.tsx · match/BattlePhase.tsx
    │   └── ProfileScreen.tsx
    ├── services/
    │   └── nfcReader.ts       # Lectura del UID del chip
    ├── store/
    │   └── useAuthStore.ts    # Sesión (Zustand + Keychain)
    └── types/                 # Tipos de cartas y partida
```

---

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `Another process is running on port 8081` | Hay un Metro anterior abierto. Ciérralo: `fuser -k 8081/tcp` (Linux/Mac). |
| `Android project not found` | Falta la carpeta `android/`. Debe venir en el repositorio; si la borraste, restaúrala con `git restore android`. |
| `adb devices` no muestra el celular o dice `unauthorized` | Activa la depuración USB, usa un cable de datos y acepta el aviso en el celular. Prueba `adb kill-server && adb start-server`. |
| Pantalla roja "Unable to load script" | Metro no es alcanzable: `adb reverse tcp:8081 tcp:8081` y recarga (`r` en la terminal de Metro). |
| "No se pudo conectar con el servidor" | Revisa que el backend esté corriendo (`http://localhost:3000/health`), que `HOST` sea correcto y, con Wi-Fi, que el firewall deje pasar el puerto 3000. Con USB, repite `adb reverse tcp:3000 tcp:3000`. |
| La sesión se cierra sola | El token venció (duran 7 días) o el servidor cambió su `JWT_SECRET`. Vuelve a iniciar sesión. |
| "Carta no reconocida" al escanear | El chip no está registrado en el backend. El mensaje incluye el UID que leyó el teléfono; regístralo con `npm run tag:register -- <UID> "<carta>"` en `arkana-backend`. |
| El NFC no responde | Activa NFC en los ajustes, quita la funda metálica y acerca la carta a la zona de la antena (normalmente la parte superior trasera). |
| Fallos raros de compilación tras actualizar | `cd android && ./gradlew clean && cd ..` y vuelve a ejecutar `npm run android`. Si persiste: `npm start -- --reset-cache`. |
| `Ya tienes una partida en curso` | Cerraste la app en medio de una partida. Se libera sola a los 30 segundos. |
| Dos jugadores no se emparejan | Ambos deben estar en la cola a la vez, con cuentas **distintas**. |

---

## Flujo de trabajo con Git

- `main`: versión estable.
- `develop`: integración; el CI corre en cada *push* y *Pull Request* hacia estas dos ramas.
- Las ramas de trabajo (`feat/…`, `fix/…`) salen de `develop` y vuelven por Pull Request.
- Release: `develop` → Pull Request → `main`.
- Convención de commits: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `refactor:`.