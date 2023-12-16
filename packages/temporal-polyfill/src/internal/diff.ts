import { DayTimeNano, compareDayTimeNanos, dayTimeNanoToNumber, diffDayTimeNanos } from './dayTimeNano'
import {
  DurationFields,
  DurationFieldsWithSign,
  durationFieldDefaults,
  nanoToDurationDayTimeFields,
  nanoToDurationTimeFields,
  updateDurationFieldsSign,
} from './durationFields'
import { IsoDateFields, IsoTimeFields, IsoDateTimeFields, isoTimeFieldDefaults, isoTimeFieldNamesDesc } from './calendarIsoFields'
import {
  isoDaysInWeek,
  isoMonthsInYear,
  isoTimeFieldsToNano,
  isoToEpochMilli,
  isoToEpochNano,
} from './isoMath'
import { moveByIsoDays, moveDateTime, moveZonedEpochNano } from './move'
import { Overflow, RoundingMode } from './options'
import { computeNanoInc, roundByInc, roundDayTimeNano, roundRelativeDuration } from './round'
import { TimeZoneOps, getSingleInstantFor, zonedEpochNanoToIso } from './timeZoneOps'
import {
  DayTimeUnit,
  TimeUnit,
  Unit,
  milliInDay,
  nanoInUtcDay,
} from './units'
import { NumSign, divModTrunc, identityFunc, pluckProps } from './utils'
import { NativeDiffOps } from './calendarNative'
import { IntlCalendar, computeIntlMonthsInYear } from './calendarIntl'
import { DiffOps } from './calendarOps'

// Dates & Times
// -------------------------------------------------------------------------------------------------

export function diffDateTimes(
  calendarOps: DiffOps,
  startIsoFields: IsoDateTimeFields,
  endIsoFields: IsoDateTimeFields,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
): DurationFields {
  const startEpochNano = isoToEpochNano(startIsoFields)!
  const endEpochNano = isoToEpochNano(endIsoFields)!

  if (largestUnit <= Unit.Day) {
    return diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    )
  }

  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  let timeNano = endTimeNano - startTimeNano
  const timeSign = Math.sign(timeNano)

  // simulate startDate plus time fields (because that happens before adding date)
  let midIsoFields: IsoDateFields = startIsoFields

  // move start-fields forward so time-diff-sign matches date-diff-sign
  if (timeSign === -sign) {
    midIsoFields = moveByIsoDays(startIsoFields, sign)
    timeNano += nanoInUtcDay * sign
  }

  const dateDiff = calendarDateUntilEasy(
    calendarOps,
    { ...midIsoFields, ...isoTimeFieldDefaults }, // hack
    { ...endIsoFields, ...isoTimeFieldDefaults }, // hack
    largestUnit,
  )
  const timeDiff = nanoToDurationTimeFields(timeNano)

  return roundRelativeDuration(
    { ...dateDiff, ...timeDiff },
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startIsoFields, // marker
    isoToEpochNano as (isoFields: IsoDateTimeFields) => DayTimeNano, // markerToEpochNano -- TODO: better after removing `!`
    (m: IsoDateTimeFields, d: DurationFields) => moveDateTime(calendarOps, m, d, Overflow.Constrain),
  )
}

export function diffDates(
  calendarOps: DiffOps,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit, // TODO: large field
  smallestUnit: Unit, // TODO: large field
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  const dateDiff = calendarDateUntilEasy(calendarOps, startIsoFields, endIsoFields, largestUnit)

  // fast path, no rounding
  // important for tests and custom calendars
  if (smallestUnit === Unit.Day && roundingInc === 1) {
    return dateDiff
  }

  return roundRelativeDuration(
    dateDiff,
    isoToEpochNano(endIsoFields)!,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startIsoFields, // marker
    isoToEpochNano as (isoFields: IsoDateFields) => DayTimeNano, // markerToEpochNano
    (m: IsoDateFields, d: DurationFields) => calendarOps.dateAdd(m, updateDurationFieldsSign(d), Overflow.Constrain),
  )
}

function diffDays(
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
): number {
  return diffEpochMilliByDay(
    isoToEpochMilli(startIsoFields)!,
    isoToEpochMilli(endIsoFields)!,
  )
}

export function nativeDateUntil(
  this: NativeDiffOps,
  startIsoFields: IsoDateFields,
  endIsoFields: IsoDateFields,
  largestUnit: Unit,
): DurationFieldsWithSign {
  if (largestUnit <= Unit.Week) {
    let weeks = 0
    let days = diffDays(startIsoFields, endIsoFields)
    const sign = Math.sign(days) as NumSign

    if (largestUnit === Unit.Week) {
      [weeks, days] = divModTrunc(days, isoDaysInWeek)
    }

    return { ...durationFieldDefaults, weeks, days, sign }
  }

  const yearMonthDayStart = this.dateParts(startIsoFields)
  const yearMonthDayEnd = this.dateParts(endIsoFields)
  let [years, months, days, sign] = diffYearMonthDay(
    this,
    ...yearMonthDayStart,
    ...yearMonthDayEnd,
  )

  if (largestUnit === Unit.Month) {
    months += this.monthsInYearSpan(years, yearMonthDayStart[0])
    years = 0
  }

  return { ...durationFieldDefaults, years, months, days, sign }
}

export function diffTimes(
  startIsoFields: IsoTimeFields,
  endIsoFields: IsoTimeFields,
  largestUnit: TimeUnit,
  smallestUnit: TimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  const startTimeNano = isoTimeFieldsToNano(startIsoFields)
  const endTimeNano = isoTimeFieldsToNano(endIsoFields)
  const nanoInc = computeNanoInc(smallestUnit, roundingInc)
  const timeNano = roundByInc(endTimeNano - startTimeNano, nanoInc, roundingMode)

  return {
    ...durationFieldDefaults,
    ...nanoToDurationTimeFields(timeNano, largestUnit),
  }
}

// Epoch
// -------------------------------------------------------------------------------------------------

export function diffZonedEpochNano(
  calendarOps: DiffOps,
  timeZoneOps: TimeZoneOps,
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: Unit,
  smallestUnit: Unit = Unit.Nanosecond,
  roundingInc: number = 1,
  roundingMode: RoundingMode = RoundingMode.HalfExpand,
): DurationFieldsWithSign {
  if (largestUnit < Unit.Day) {
    // doesn't need timeZone
    return updateDurationFieldsSign(diffEpochNano(
      startEpochNano,
      endEpochNano,
      largestUnit as TimeUnit,
      smallestUnit as TimeUnit,
      roundingInc,
      roundingMode,
    ))
  }
  const sign = compareDayTimeNanos(endEpochNano, startEpochNano)
  if (!sign) {
    return updateDurationFieldsSign(durationFieldDefaults)
  }

  const startIsoFields = zonedEpochNanoToIso(timeZoneOps, startEpochNano)
  const startIsoTimeFields = pluckProps(isoTimeFieldNamesDesc, startIsoFields)
  const endIsoFields = zonedEpochNanoToIso(timeZoneOps, endEpochNano)
  const isoToZonedEpochNano = getSingleInstantFor.bind(undefined, timeZoneOps) // necessary to bind?
  let midIsoFields = { ...endIsoFields, ...startIsoTimeFields }
  let midEpochNano = isoToZonedEpochNano(midIsoFields)
  let midSign = compareDayTimeNanos(endEpochNano, midEpochNano)

  // Might need multiple backoffs: one for simple time overage, other for end being in DST gap
  // TODO: use a do-while loop?
  while (midSign === -sign) {
    midIsoFields = {
      ...moveByIsoDays(midIsoFields, -sign),
      ...startIsoTimeFields,
    }
    midEpochNano = isoToZonedEpochNano(midIsoFields)
    midSign = compareDayTimeNanos(endEpochNano, midEpochNano)
  }

  const dateDiff = calendarDateUntilEasy(calendarOps, startIsoFields, midIsoFields, largestUnit)
  const timeDiffNano = dayTimeNanoToNumber(diffDayTimeNanos(midEpochNano, endEpochNano)) // could be over 24 hour, so we need to consider day too
  const timeDiff = nanoToDurationTimeFields(timeDiffNano)

  return updateDurationFieldsSign(roundRelativeDuration(
    { ...dateDiff, ...timeDiff },
    endEpochNano,
    largestUnit,
    smallestUnit,
    roundingInc,
    roundingMode,
    startEpochNano, // marker
    identityFunc, // markerToEpochNano
    // TODO: better way to bind
    (m: DayTimeNano, d: DurationFields) => moveZonedEpochNano(calendarOps, timeZoneOps, m, d, Overflow.Constrain),
  ))
}

export function diffEpochNano(
  startEpochNano: DayTimeNano,
  endEpochNano: DayTimeNano,
  largestUnit: DayTimeUnit,
  smallestUnit: DayTimeUnit,
  roundingInc: number,
  roundingMode: RoundingMode,
): DurationFields {
  return {
    ...durationFieldDefaults,
    ...nanoToDurationDayTimeFields(
      roundDayTimeNano(
        diffDayTimeNanos(startEpochNano, endEpochNano),
        smallestUnit,
        roundingInc,
        roundingMode,
      ),
      largestUnit,
    ),
  }
}

/*
Must always be given start-of-day
*/
export function diffEpochMilliByDay( // TODO: rename diffEpochMilliDays?
  epochMilli0: number,
  epochMilli1: number,
): number {
  return Math.round((epochMilli1 - epochMilli0) / milliInDay)
}

// Calendar Utils
// -------------------------------------------------------------------------------------------------

export function calendarDateUntilEasy(
  calendarOps: DiffOps,
  isoDateFields0: IsoDateFields,
  isoDateFields1: IsoDateFields,
  largestUnit: Unit, // largeUnit
): DurationFieldsWithSign {
  if (largestUnit === Unit.Day) {
    return updateDurationFieldsSign({
      ...durationFieldDefaults,
      days: diffDays(isoDateFields0, isoDateFields1)
    })
  }
  return calendarOps.dateUntil(isoDateFields0, isoDateFields1, largestUnit)
}

function diffYearMonthDay(
  calendarNative: NativeDiffOps,
  year0: number,
  month0: number,
  day0: number,
  year1: number,
  month1: number,
  day1: number,
): [
  yearDiff: number,
  monthDiff: number,
  dayDiff: number,
  sign: NumSign,
] {
  let yearDiff!: number
  let monthsInYear1!: number
  let monthDiff!: number
  let daysInMonth1!: number
  let dayDiff!: number

  function updateYearMonth() {
    let [monthCodeNumber0, isLeapYear0] = calendarNative.monthCodeParts(year0, month0)
    let [monthCodeNumber1, isLeapYear1] = calendarNative.monthCodeParts(year1, month1)

    yearDiff = year1 - year0
    monthsInYear1 = calendarNative.monthsInYearPart(year1)
    monthDiff = yearDiff
      // crossing years
      ? (monthCodeNumber1 - monthCodeNumber0) || (Number(isLeapYear1) - Number(isLeapYear0))
      // same year
      : month1 - Math.min(month0, monthsInYear1)
  }

  function updateYearMonthDay() {
    updateYearMonth()
    daysInMonth1 = calendarNative.daysInMonthParts(year1, month1)
    dayDiff = day1 - Math.min(day0, daysInMonth1)
  }

  updateYearMonthDay()
  const daySign = Math.sign(dayDiff) as NumSign
  const sign = (Math.sign(yearDiff) || Math.sign(monthDiff) || daySign) as NumSign

  if (sign) {
    // overshooting day? correct by moving to penultimate month
    if (daySign === -sign) {
      const oldDaysInMonth1 = daysInMonth1
      ;([year1, month1] = calendarNative.monthAdd(year1, month1, -sign))
      updateYearMonthDay()
      dayDiff += sign < 0 // correct with days-in-month further in past
        ? -oldDaysInMonth1 // correcting from past -> future
        : daysInMonth1 // correcting from future -> past
    }

    // overshooting month? correct by moving to penultimate year
    const monthSign = Math.sign(monthDiff) as NumSign
    if (monthSign === -sign) {
      const oldMonthsInYear1 = monthsInYear1
      year1 -= sign
      updateYearMonth()
      monthDiff += sign < 0 // correct with months-in-year further in past
        ? -oldMonthsInYear1 // correcting from past -> future
        : monthsInYear1 // correcting from future -> past
    }
  }

  return [yearDiff, monthDiff, dayDiff, sign]
}

export function computeIsoMonthsInYearSpan(yearDelta: number): number {
  return yearDelta * isoMonthsInYear
}

export function computeIntlMonthsInYearSpan(
  this: IntlCalendar,
  yearDelta: number,
  yearStart: number,
): number {
  const yearEnd = yearStart + yearDelta
  const yearSign = Math.sign(yearDelta)
  const yearCorrection = yearSign < 0 ? -1 : 0
  let months = 0

  for (let year = yearStart; year !== yearEnd; year += yearSign) {
    months += computeIntlMonthsInYear.call(this, year + yearCorrection)
  }

  return months
}
