// El backend responde { error: "mensaje" }. Si ni siquiera hubo respuesta, es un problema de red.
export const errorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.error ??
  (error?.request && !error?.response ? 'No se pudo conectar con el servidor.' : fallback);
