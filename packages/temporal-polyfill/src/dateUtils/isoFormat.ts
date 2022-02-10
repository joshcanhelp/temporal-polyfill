import {
  CALENDAR_DISPLAY_ALWAYS,
  CALENDAR_DISPLAY_NEVER,
  CalendarDisplayInt,
} from '../argParse/calendarDisplay'
import { DurationToStringConfig, TimeToStringConfig } from '../argParse/isoFormatOptions'
import { TIME_ZONE_DISPLAY_NEVER, TimeZoneDisplayInt } from '../argParse/timeZoneDisplay'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import { TimeISOEssentials } from '../dateUtils/time'
import { DateISOFields } from '../public/types'
import { RoundingFunc, roundToIncrementBI } from '../utils/math'
import { getSignStr, padZeros } from '../utils/string'
import { DateISOEssentials } from './date'
import { DateTimeISOEssentials } from './dateTime'
import { nanoToDayTimeFields } from './dayTime'
import { SignedDurationFields } from './duration'
import {
  HOUR,
  MINUTE,
  SECOND,
  nanoInMicroBI,
  nanoInMilliBI,
  nanoInSecondBI,
  nanoIn,
  TimeUnitInt,
} from './units'

// given ISO fields should already be rounded
export function formatDateTimeISO(
  fields: DateTimeISOEssentials,
  formatConfig: TimeToStringConfig,
): string {
  return formatDateISO(fields) + 'T' + formatTimeISO(fields, formatConfig)
}

export function formatDateISO(fields: DateISOEssentials): string {
  return formatYearMonthISO(fields) + '-' + padZeros(fields.isoDay, 2)
}

export function formatYearMonthISO(fields: DateISOEssentials): string {
  const { isoYear } = fields
  return (
    (isoYear < 1000 || isoYear > 9999)
      ? getSignStr(isoYear) + padZeros(Math.abs(isoYear), 6)
      : padZeros(isoYear, 4)
  ) + '-' + padZeros(fields.isoMonth, 2)
}

export function formatMonthDayISO(fields: DateISOFields): string {
  return padZeros(fields.isoMonth, 2) + '-' + padZeros(fields.isoDay, 2)
}

// given ISO fields should already be rounded
// formatConfig is NOT for rounding. only for smallestUnit/fractionalSecondDigits
export function formatTimeISO(
  fields: TimeISOEssentials,
  formatConfig: TimeToStringConfig, // tighten type? remove roundingMode?
): string {
  const parts: string[] = [padZeros(fields.isoHour, 2)]

  if (formatConfig.smallestUnit <= MINUTE) {
    parts.push(padZeros(fields.isoMinute, 2))

    if (formatConfig.smallestUnit <= SECOND) {
      parts.push(
        padZeros(fields.isoSecond, 2) +
          formatPartialSeconds(
            fields.isoMillisecond,
            fields.isoMicrosecond,
            fields.isoNanosecond,
            formatConfig.fractionalSecondDigits,
          )[0],
      )
    }
  }

  return parts.join(':')
}

export function formatOffsetISO(offsetNano: number): string {
  const fields = nanoToDayTimeFields(BigInt(Math.abs(offsetNano)), HOUR) // TODO: cleaner util
  return getSignStr(offsetNano) +
    padZeros(fields.hour!, 2) + ':' +
    padZeros(fields.minute!, 2) +
    (fields.second
      ? ':' + padZeros(fields.second, 2)
      : '')
}

export function formatCalendarID(
  calendarID: string | undefined,
  display: CalendarDisplayInt,
): string {
  if (
    calendarID && ( // might be blank if custom calendar implementation
      display === CALENDAR_DISPLAY_ALWAYS ||
      (display !== CALENDAR_DISPLAY_NEVER && calendarID !== isoCalendarID)
    )
  ) {
    return `[u-ca=${calendarID}]`
  }
  return ''
}

export function formatTimeZoneID(timeZoneID: string, display: TimeZoneDisplayInt): string {
  if (display !== TIME_ZONE_DISPLAY_NEVER) {
    return `[${timeZoneID}]`
  }
  return ''
}

export function formatDurationISO(
  fields: SignedDurationFields,
  formatConfig: DurationToStringConfig,
): string {
  const { smallestUnit, fractionalSecondDigits } = formatConfig
  let { sign, hours, minutes, seconds } = fields
  let partialSecondsStr = ''

  if (smallestUnit <= SECOND) { // should be just less-than!!?
    const res = formatPartialSeconds(
      fields.milliseconds,
      fields.microseconds,
      fields.nanoseconds,
      fractionalSecondDigits,
      formatConfig.roundingMode,
      formatConfig.smallestUnit,
    )
    partialSecondsStr = res[0]
    seconds += res[1]
  }

  return (sign < 0 ? '-' : '') + 'P' +
    collapseDurationTuples([
      [fields.years, 'Y'],
      [fields.months, 'M'],
      [fields.weeks, 'W'],
      [fields.days, 'D', !sign], // ensures 'P0D' if empty duration
    ]) +
    (hours || minutes || seconds || partialSecondsStr
      ? 'T' +
      collapseDurationTuples([
        [hours, 'H'],
        [minutes, 'M'],
        [
          smallestUnit <= SECOND ? seconds : 0,
          partialSecondsStr + 'S',
          partialSecondsStr, // ensures seconds if partialSecondsStr
        ],
      ])
      : '')
}

function collapseDurationTuples(tuples: [number, string, unknown?][]): string {
  return tuples.map(([num, postfix, forceShow]) => {
    if (forceShow || num) {
      return Math.abs(num) + postfix
    }
    return ''
  }).join('')
}

function formatPartialSeconds(
  milliseconds: number,
  microseconds: number,
  nanoseconds: number,
  fractionalSecondDigits: number | undefined,
  roundingFunc?: RoundingFunc, // HACK
  smallestUnit?: TimeUnitInt, // HACK
): [string, number] { // [afterDecimalStr, secondsOverflow]
  let totalNano =
    BigInt(nanoseconds) +
    BigInt(microseconds) * nanoInMicroBI +
    BigInt(milliseconds) * nanoInMilliBI

  // HACK. sometimes input is pre-rounded, other times not
  // not DRY. search for Math.pow
  if (roundingFunc) {
    totalNano = roundToIncrementBI(
      totalNano,
      fractionalSecondDigits === undefined
        ? nanoIn[smallestUnit!]
        : Math.pow(10, 9 - fractionalSecondDigits),
      roundingFunc,
    )
  }

  const totalNanoAbs = totalNano < 0 ? -totalNano : totalNano // TODO: util for abs() for bigints
  const seconds = totalNanoAbs / nanoInSecondBI
  const leftoverNano = totalNanoAbs - (seconds * nanoInSecondBI)

  let afterDecimal = padZeros(Number(leftoverNano), 9)
  afterDecimal = fractionalSecondDigits === undefined
    ? afterDecimal.replace(/0+$/, '') // strip trailing zeros
    : afterDecimal.substr(0, fractionalSecondDigits)

  return [
    afterDecimal ? '.' + afterDecimal : '',
    Number(seconds) * (totalNano < 0 ? -1 : 1), // restore sign (TODO: sign util for bigints)
  ]
}
