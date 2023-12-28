import { EraYearFields, YearMonthBag, YearMonthFields, YearMonthFieldsIntl } from '../internal/calendarFields'
import { NumSign } from '../internal/utils'
import { LocalesArg, prepCachedPlainYearMonthFormat } from '../internal/formatIntl'
import { DateTimeDisplayOptions, DiffOptions, OverflowOptions } from '../internal/optionsRefine'
import { DurationSlots, PlainDateSlots, PlainYearMonthSlots, getCalendarIdFromBag, refineCalendarSlotString } from '../internal/slots'
import * as Utils from './utils'
import { createNativeDateModOps, createNativePartOps, createNativeYearMonthDiffOps, createNativeYearMonthModOps, createNativeYearMonthMoveOps, createNativeYearMonthParseOps, createNativeYearMonthRefineOps } from '../internal/calendarNativeQuery'
import { computeYearMonthFields } from '../internal/calendarNative'
import { createPlainYearMonthSlots } from '../internal/slotsCreate'
import { parsePlainYearMonth } from '../internal/parseIso'
import { plainYearMonthWithFields, refinePlainYearMonthBag } from '../internal/bag'
import { movePlainYearMonth } from '../internal/move'
import { diffPlainYearMonth } from '../internal/diff'
import { compareIsoDateFields } from '../internal/epochAndTime'
import { plainYearMonthsEqual } from '../internal/compare'
import { formatPlainYearMonthIso } from '../internal/formatIso'
import { plainYearMonthToPlainDate } from '../internal/convert'

export function create(
  isoYear: number,
  isoMonth: number,
  calendar?: string,
  referenceIsoDay?: number,
): PlainYearMonthSlots<string> {
  return createPlainYearMonthSlots(refineCalendarSlotString, isoYear, isoMonth, calendar, referenceIsoDay)
}

export function fromString(s: string): PlainYearMonthSlots<string> {
  return parsePlainYearMonth(createNativeYearMonthParseOps, s)
}

export function fromFields(
  bag: YearMonthBag & { calendar?: string },
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return refinePlainYearMonthBag(
    createNativeYearMonthRefineOps(getCalendarIdFromBag(bag)),
    bag,
    options,
  )
}

// TODO: put this in utils
export function getFields(slots: PlainYearMonthSlots<string>): YearMonthFields & Partial<EraYearFields> {
  const calendarOps = createNativePartOps(slots.calendar)
  return computeYearMonthFields(calendarOps, slots)
}

// TODO: add specific types
export const daysInMonth = Utils.daysInMonth
export const daysInYear = Utils.daysInYear
export const monthsInYear = Utils.monthsInYear
export const inLeapYear = Utils.inLeapYear

export function withFields(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  initialFields: YearMonthFieldsIntl,
  mod: YearMonthBag,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return plainYearMonthWithFields(
    createNativeYearMonthModOps,
    plainYearMonthSlots,
    initialFields,
    mod,
    options,
  )
}

export function add(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return movePlainYearMonth(
    createNativeYearMonthMoveOps,
    false,
    plainYearMonthSlots,
    durationSlots,
    options,
  )
}

export function subtract(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  durationSlots: DurationSlots,
  options?: OverflowOptions,
): PlainYearMonthSlots<string> {
  return movePlainYearMonth(
    createNativeYearMonthMoveOps,
    true,
    plainYearMonthSlots,
    durationSlots,
    options,
  )
}

export function until(
  plainYearMonthSlots0: PlainYearMonthSlots<string>,
  plainYearMonthSlots1: PlainYearMonthSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainYearMonth(
    createNativeYearMonthDiffOps,
    plainYearMonthSlots0,
    plainYearMonthSlots1,
    options,
  )
}

export function since(
  plainYearMonthSlots0: PlainYearMonthSlots<string>,
  plainYearMonthSlots1: PlainYearMonthSlots<string>,
  options?: DiffOptions,
): DurationSlots {
  return diffPlainYearMonth(
    createNativeYearMonthDiffOps,
    plainYearMonthSlots0,
    plainYearMonthSlots1,
    options,
    true,
  )
}

export const compare = compareIsoDateFields

export const equals = plainYearMonthsEqual

export const toString = formatPlainYearMonthIso

export function toPlainDate(
  plainYearMonthSlots: PlainYearMonthSlots<string>,
  plainYearMonthFields: YearMonthFieldsIntl,
  bag: { day: number },
): PlainDateSlots<string> {
  return plainYearMonthToPlainDate(
    createNativeDateModOps,
    plainYearMonthSlots,
    plainYearMonthFields,
    bag,
  )
}

export function toLocaleString(
  slots: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainYearMonthFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainYearMonthFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainYearMonthSlots<string>,
  slots1: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainYearMonthFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainYearMonthSlots<string>,
  slots1: PlainYearMonthSlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainYearMonthFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
