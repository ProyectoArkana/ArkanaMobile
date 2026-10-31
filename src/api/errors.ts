export const parseApiError = (error: any): string => {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error;
  }
  return error.message || 'Error de conexión';
};