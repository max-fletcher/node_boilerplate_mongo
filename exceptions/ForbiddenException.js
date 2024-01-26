class ForbiddenException extends Error {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name
    this.status = 403
  }
}

module.exports = ForbiddenException  