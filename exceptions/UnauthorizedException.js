class UnauthorizedException extends Error {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name
    this.status = 401
  }
}

module.exports = UnauthorizedException  