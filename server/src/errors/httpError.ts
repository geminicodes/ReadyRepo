export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly publicMessage: string;
  public readonly details?: Record<string, unknown>;

  constructor(params: {
    statusCode: number;
    publicMessage: string;
    internalMessage?: string;
    details?: Record<string, unknown>;
  }) {
    super(params.internalMessage ?? params.publicMessage);
    this.name = "HttpError";
    this.statusCode = params.statusCode;
    this.publicMessage = params.publicMessage;
    this.details = params.details;
  }
}
