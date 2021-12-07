import { unitNames } from '../argParse/unitStr'
import { TimeFields, timeFieldsToNano } from './time'
import { DayTimeUnitInt, NANOSECOND, nanoIn, nanoInDayBI } from './units'

export type DayTimeFields = TimeFields & { day: number }

export function dayTimeFieldsToNano(fields: DayTimeFields): bigint {
  return BigInt(fields.day) * nanoInDayBI + timeFieldsToNano(fields)
}

export function nanoToDayTimeFields(
  nano: bigint,
  largestUnit: DayTimeUnitInt,
): Partial<DayTimeFields> {
  const fields: Partial<DayTimeFields> = {}

  for (let unit = largestUnit; unit >= NANOSECOND; unit--) {
    const unitNano = BigInt(nanoIn[unit])
    const whole = nano / unitNano
    nano -= whole * unitNano
    fields[unitNames[unit] as keyof DayTimeFields] = Number(whole)
  }

  return fields
}

export function splitEpochNano(epochNano: bigint): [ bigint, bigint] { // [dayNano, timeNano]
  let dayNano = epochNano / nanoInDayBI * nanoInDayBI
  let timeNano = epochNano - dayNano

  // HACK for bigint division and doing floor() for negative numbers
  if (timeNano < 0) {
    timeNano += nanoInDayBI
    dayNano -= nanoInDayBI
  }

  return [dayNano, timeNano]
}
