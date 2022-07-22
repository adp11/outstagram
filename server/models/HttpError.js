class HttpError {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }

  static badRequest(msg) {
    return new HttpError(400, msg);
  }

  static unauthorized(msg) {
    return new HttpError(401, msg);
  }

  static forbidden(msg) {
    return new HttpError(403, msg);
  }

  static notFound(msg) {
    return new HttpError(404, msg);
  }

  static internal(msg) {
    return new HttpError(500, msg);
  }
}

module.exports = HttpError;
