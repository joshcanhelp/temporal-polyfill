import { parseDiffOptions } from '../argParse/diffOptions'
import { timeFieldMap } from '../argParse/fieldStr'
import { OverflowHandlingInt } from '../argParse/overflowHandling'
import { constrainValue } from '../argParse/refine'
import { parseRoundOptions } from '../argParse/roundOptions'
import { Duration } from '../public/duration'
import { PlainTime } from '../public/plainTime'
import {
  CompareResult,
  TimeArg,
  TimeDiffOptions,
  TimeLike,
  TimeRoundOptions,
  TimeUnit,
} from '../public/types'
import { compareValues } from '../utils/math'
import { mapHash } from '../utils/obj'
import { ensureObj } from './abstract'
import { nanoToDayTimeFields } from './dayTime'
import { durationToTimeFields, nanoToDuration } from './duration'
import { roundNano, roundTimeOfDay } from './round'
import {
  DAY,
  HOUR,
  NANOSECOND,
  TimeUnitInt,
  nanoInDayBI,
  nanoInHour,
  nanoInMicro,
  nanoInMilli,
  nanoInMinute,
  nanoInSecond,
} from './units'

export interface TimeISOMilli {
  isoHour: number
  isoMinute: number
  isoSecond: number
  isoMillisecond: number
}

export interface TimeISOEssentials extends TimeISOMilli {
  isoMicrosecond: number
  isoNanosecond: number
}

export interface TimeFields {
  hour: number
  minute: number
  second: number
  millisecond: number
  microsecond: number
  nanosecond: number
}

export function createTime(isoFields: TimeISOEssentials): PlainTime {
  return new PlainTime(
    isoFields.isoHour,
    isoFields.isoMinute,
    isoFields.isoSecond,
    isoFields.isoMillisecond,
    isoFields.isoMicrosecond,
    isoFields.isoNanosecond,
  )
}

export function constrainTimeISO( // also converts to number
  {
    isoHour, isoMinute, isoSecond,
    isoMillisecond, isoMicrosecond, isoNanosecond,
  }: TimeISOEssentials,
  overflow: OverflowHandlingInt,
): TimeISOEssentials {
  isoHour = constrainValue(isoHour, 0, 23, overflow)
  isoMinute = constrainValue(isoMinute, 0, 59, overflow)
  isoSecond = constrainValue(isoSecond, 0, 59, overflow)
  isoMillisecond = constrainValue(isoMillisecond, 0, 999, overflow)
  isoMicrosecond = constrainValue(isoMicrosecond, 0, 999, overflow)
  isoNanosecond = constrainValue(isoNanosecond, 0, 999, overflow)
  return { isoHour, isoMinute, isoSecond, isoMillisecond, isoMicrosecond, isoNanosecond }
}

export function overrideTimeFields(overrides: Partial<TimeFields>, base: TimeFields): TimeFields {
  return mapHash(timeFieldMap, (_refineFunc, fieldName) => (
    overrides[fieldName as keyof TimeFields] ?? base[fieldName as keyof TimeFields]
  ))
}

export function addToPlainTime(time: PlainTime, dur: Duration): PlainTime {
  const [fields] = addTimeFields(time, durationToTimeFields(dur))
  return createTime(timeLikeToISO(fields))
}

export function diffPlainTimes(
  t0: PlainTime,
  t1: PlainTime,
  options: TimeDiffOptions | undefined,
): Duration {
  const diffConfig = parseDiffOptions<TimeUnit, TimeUnitInt>(
    options,
    NANOSECOND, // largestUnitDefault
    HOUR, // smallestUnitDefault
    NANOSECOND, // minUnit
    HOUR, // maxUnit
  )
  return nanoToDuration(
    roundNano(timeFieldsToNano(t1) - timeFieldsToNano(t0), diffConfig),
    diffConfig.largestUnit,
  )
}

export function roundPlainTime(plainTime: PlainTime, options: TimeRoundOptions): PlainTime {
  const roundConfig = parseRoundOptions<TimeUnit, TimeUnitInt>(
    options,
    undefined, // no default. required
    NANOSECOND, // minUnit
    HOUR, // maxUnit
  )
  const [fields] = roundTimeOfDay(plainTime, roundConfig)
  return createTime(timeLikeToISO(fields))
}

export function timeFieldsToConstrainedISO(
  fields: TimeLike,
  overflowHandling: OverflowHandlingInt,
): TimeISOEssentials {
  return constrainTimeISO(
    timeLikeToISO(fields),
    overflowHandling,
  )
}

// Normally ensureObj and ::from would fail when undefined is specified
// Fallback to 00:00 time
export function ensureLooseTime(arg: TimeArg | undefined): PlainTime {
  return ensureObj(PlainTime, arg ?? { hour: 0 })
}

// Nanosecond Math

export function addTimeFields(t0: TimeFields, t1: TimeFields): [TimeFields, number] {
  return nanoToWrappedTimeFields(timeFieldsToNano(t0) + timeFieldsToNano(t1))
}

export function diffTimeFields(t0: TimeFields, t1: TimeFields): [TimeFields, number] {
  return nanoToWrappedTimeFields(timeFieldsToNano(t1) - timeFieldsToNano(t0))
}

export function compareTimes(t0: PlainTime, t1: PlainTime): CompareResult {
  return compareValues(timeFieldsToNano(t0), timeFieldsToNano(t1))
}

// Object -> Nanoseconds

export function timeFieldsToNano(timeFields: TimeFields): bigint {
  return BigInt(
    timeFields.hour * nanoInHour +
    timeFields.minute * nanoInMinute +
    timeFields.second * nanoInSecond +
    timeFields.millisecond * nanoInMilli +
    timeFields.microsecond * nanoInMicro +
    timeFields.nanosecond,
  )
}

export function timeISOToNano(timeISO: TimeISOEssentials): bigint {
  return BigInt(
    timeISO.isoHour * nanoInHour +
    timeISO.isoMinute * nanoInMinute +
    timeISO.isoSecond * nanoInSecond +
    timeISO.isoMillisecond * nanoInMilli +
    timeISO.isoMicrosecond * nanoInMicro +
    timeISO.isoNanosecond,
  )
}

// Nanoseconds -> Object

export function nanoToWrappedTimeFields(nano: bigint): [TimeFields, number] {
  const dayDelta = nano / nanoInDayBI
  nano -= dayDelta * nanoInDayBI

  const fields = nanoToDayTimeFields(nano, DAY)

  // repurpose DayTimeFiels as TimeFields
  delete fields.day
  return [fields as TimeFields, Number(dayDelta)]
}

// Object -> Object

export function timeLikeToISO(fields: TimeLike): TimeISOEssentials {
  return {
    isoNanosecond: fields.nanosecond ?? 0,
    isoMicrosecond: fields.microsecond ?? 0,
    isoMillisecond: fields.millisecond ?? 0,
    isoSecond: fields.second ?? 0,
    isoMinute: fields.minute ?? 0,
    isoHour: fields.hour ?? 0,
  }
}
