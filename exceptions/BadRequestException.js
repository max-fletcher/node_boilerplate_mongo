class BadRequestException extends Error {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name
    this.status = 400
  }
}

module.exports = BadRequestException  