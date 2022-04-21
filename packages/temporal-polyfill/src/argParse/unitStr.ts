import { UnsignedDurationFields } from '../dateUtils/durationFields'
import {
  LocalDateFields,
  LocalTimeFields,
  LocalYearMonthFields,
} from '../dateUtils/localFields'
import { UnitInt } from '../dateUtils/units'
import { DateUnit, TimeUnit, Unit } from '../public/types'
import { strArrayToHash } from '../utils/obj'

export type YearMonthUnitProper = keyof LocalYearMonthFields
export type DateUnitProper = keyof LocalDateFields | 'week'
export type TimeUnitProper = keyof LocalTimeFields

// These names must match the indexes of the Unit integers

export const timeUnitNames: TimeUnit[] = [
  'nanosecond',
  'microsecond',
  'millisecond',
  'second',
  'minute',
  'hour',
]
export const dateUnitNames: DateUnit[] = [
  'day',
  'week',
  'month',
  'year',
]
export const unitNames: Unit[] = [
  ...timeUnitNames,
  ...dateUnitNames,
]

// Duration / Plurals

export const durationUnitNames: (keyof UnsignedDurationFields)[] = unitNames.map(
  (unit) => (unit + 's') as keyof UnsignedDurationFields,
)

// Parsing

const unitMap = strArrayToHash(unitNames, (_str, i) => i)
const pluralUnitMap = strArrayToHash(durationUnitNames, (_str, i) => i)

export function parseUnit<UnitType extends UnitInt>(
  input: Unit | undefined,
  defaultUnit: UnitType | undefined,
  minUnit: UnitType,
  maxUnit: UnitType,
): UnitType {
  let num: UnitType
  if (input === undefined) {
    if (defaultUnit === undefined) {
      throw new RangeError('Unit is required') // TOOD: better error message with setting name
    }
    num = defaultUnit
  } else {
    num = (unitMap[input] ?? pluralUnitMap[input]) as UnitType

    if (num === undefined || num < minUnit || num > maxUnit) {
      throw new RangeError('Invalid unit ' + input) // TOOD: better error message with setting name
    }
  }

  return num
}
