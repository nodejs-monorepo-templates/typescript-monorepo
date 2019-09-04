import chalk from 'chalk'

export interface StringLike {
  toString (): string
}

export interface StyledText {
  readonly styled: StringLike
  readonly normal: StringLike
}

class StyledTextNode implements StyledText {
  public readonly styled: StringLike
  public readonly normal: StringLike

  constructor (text: StringLike, transform: (text: string) => string) {
    const value = text.toString()
    this.styled = transform(value)
    this.normal = value
  }
}

class Normal extends StyledTextNode {
  constructor (text: StringLike) {
    super(text, String)
  }
}

export const normal = (text: StringLike) => new Normal(text)

class Dim extends StyledTextNode {
  constructor (text: StringLike) {
    super(text, chalk.dim)
  }
}

export const dim = (text: StringLike) => new Dim(text)

class Bold extends StyledTextNode {
  constructor (text: StringLike) {
    super(text, chalk.bold)
  }
}

export const bold = (text: StringLike) => new Bold(text)
