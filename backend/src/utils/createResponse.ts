// /src/utils/response.ts
export interface _createResponse {
  success: boolean;
  message: string;
  data: Object | Object[] | null;
}

export const createResponse = (success: boolean, message: string, data: any): _createResponse => {
  return {
    success,
    message,
    data: data,
  };
};
