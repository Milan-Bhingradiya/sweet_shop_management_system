export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export const createResponse = <T>(success: boolean, message: string, data: T): ApiResponse<T> => {
  return {
    success,
    message,
    data,
  };
};
