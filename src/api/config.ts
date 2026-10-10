// IP de tu PC en la red local (compruébala con: hostname -I)
const HOST = '192.168.51.129';

export const API_BASE_URL = `http://${HOST}:3000/api`;
export const SOCKET_URL = `http://${HOST}:3004`;
export const MATCH_SOCKET_URL = `http://${HOST}:3005`;