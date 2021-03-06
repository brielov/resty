export enum Status {
  Continue = 100,
  SwitchingProtocols = 101,
  Processing = 102,
  EarlyHints = 103,
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultiStatus = 207,
  AlreadyReported = 208,
  ImUsed = 226,
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  PayloadTooLarge = 413,
  UriTooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  MisdirectedRequest = 421,
  UnprocessableEntity = 422,
  Locked = 423,
  FailedDependency = 424,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HttpVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NotExtended = 510,
  NetworkAuthenticationRequired = 511,
}

const REASON_PRASES: Map<Status, string> = new Map([
  [Status.Continue, "Continue"],
  [Status.SwitchingProtocols, "Switching Protocols"],
  [Status.Processing, "Processing"],
  [Status.EarlyHints, "Early Hints"],
  [Status.Ok, "OK"],
  [Status.Created, "Created"],
  [Status.Accepted, "Accepted"],
  [Status.NonAuthoritativeInformation, "Non-Authoritative Information"],
  [Status.NoContent, "No Content"],
  [Status.ResetContent, "Reset Content"],
  [Status.PartialContent, "Partial Content"],
  [Status.MultiStatus, "Multi-Status"],
  [Status.AlreadyReported, "Already Reported"],
  [Status.ImUsed, "IM Used"],
  [Status.MultipleChoices, "Multiple Choices"],
  [Status.MovedPermanently, "Moved Permanently"],
  [Status.Found, "Found"],
  [Status.SeeOther, "See Other"],
  [Status.NotModified, "Not Modified"],
  [Status.UseProxy, "Use Proxy"],
  [Status.TemporaryRedirect, "Temporary Redirect"],
  [Status.PermanentRedirect, "Permanent Redirect"],
  [Status.BadRequest, "Bad Request"],
  [Status.Unauthorized, "Unauthorized"],
  [Status.PaymentRequired, "Payment Required"],
  [Status.Forbidden, "Forbidden"],
  [Status.NotFound, "Not Found"],
  [Status.MethodNotAllowed, "Method Not Allowed"],
  [Status.NotAcceptable, "Not Acceptable"],
  [Status.ProxyAuthenticationRequired, "Proxy Authentication Required"],
  [Status.RequestTimeout, "Request Timeout"],
  [Status.Conflict, "Conflict"],
  [Status.Gone, "Gone"],
  [Status.LengthRequired, "Length Required"],
  [Status.PreconditionFailed, "Precondition Failed"],
  [Status.PayloadTooLarge, "Payload Too Large"],
  [Status.UriTooLong, "URI Too Long"],
  [Status.UnsupportedMediaType, "Unsupported Media Type"],
  [Status.RangeNotSatisfiable, "Range Not Satisfiable"],
  [Status.ExpectationFailed, "Expectation Failed"],
  [Status.ImATeapot, "I'm a teapot"],
  [Status.MisdirectedRequest, "Misdirected Request"],
  [Status.UnprocessableEntity, "Unprocessable Entity"],
  [Status.Locked, "Locked"],
  [Status.FailedDependency, "Failed Dependency"],
  [Status.UpgradeRequired, "Upgrade Required"],
  [Status.PreconditionRequired, "Precondition Required"],
  [Status.TooManyRequests, "Too Many Requests"],
  [Status.RequestHeaderFieldsTooLarge, "Request Header Fields Too Large"],
  [Status.UnavailableForLegalReasons, "Unavailable For Legal Reasons"],
  [Status.InternalServerError, "Internal Server Error"],
  [Status.NotImplemented, "Not Implemented"],
  [Status.BadGateway, "Bad Gateway"],
  [Status.ServiceUnavailable, "Service Unavailable"],
  [Status.GatewayTimeout, "Gateway Timeout"],
  [Status.HttpVersionNotSupported, "HTTP Version Not Supported"],
  [Status.VariantAlsoNegotiates, "Variant Also Negotiates"],
  [Status.InsufficientStorage, "Insufficient Storage"],
  [Status.LoopDetected, "Loop Detected"],
  [Status.NotExtended, "Not Extended"],
  [Status.NetworkAuthenticationRequired, "Network Authentication Required"],
]);

/**
 * The reason phrase for a given status code.
 */
export function getReasonPhrase(status: Status): string {
  return REASON_PRASES.get(status) || "Unknown Reason";
}
