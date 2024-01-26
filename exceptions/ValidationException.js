class ValidationException extends Error {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name
    this.status = 422
  }
}

module.exports = ValidationException  