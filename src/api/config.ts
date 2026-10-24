// IP de tu PC en la red local (compruébala con: hostname -I).
// Con ADB reverse (adb reverse tcp:3000 tcp:3000) puedes usar 'localhost'.
const HOST = '192.168.50.249';

// TODA la app habla solo con el API Gateway (puerto 3000): REST y WebSockets.
const GATEWAY = `http://${HOST}:3000`;

export const API_BASE_URL = `${GATEWAY}/api`;
export const SOCKET_ORIGIN = GATEWAY;
export const QUEUE_SOCKET_PATH = '/ws/queue'; // matchmaking
export const BATTLE_SOCKET_PATH = '/ws/battle'; // batalla
