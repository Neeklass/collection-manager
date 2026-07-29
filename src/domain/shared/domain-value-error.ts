export class DomainValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainValueError";
  }
}
