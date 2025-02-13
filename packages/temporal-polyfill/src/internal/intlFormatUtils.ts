export type LocalesArg = string | string[]
export type OptionNames = (keyof Intl.DateTimeFormatOptions)[]
export type RawFormattable = number | Date

export const RawDateTimeFormat = Intl.DateTimeFormat

export const standardLocaleId = 'en-GB' // 24-hour clock, gregorian by default

export function hashIntlFormatParts(
  intlFormat: Intl.DateTimeFormat,
  epochMilliseconds: number,
): Record<string, string> {
  const parts = intlFormat.formatToParts(epochMilliseconds)
  const hash = {} as Record<string, string>

  for (const part of parts) {
    hash[part.type] = part.value
  }

  return hash
}
