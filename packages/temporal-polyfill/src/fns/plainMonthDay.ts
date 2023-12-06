import { isoCalendarId } from '../internal/calendarConfig'
import { MonthDayBag, MonthDayFields, YearFields } from '../internal/calendarFields'
import { queryCalendarImpl } from '../internal/calendarImplQuery'
import { LocalesArg, prepCachedPlainMonthDayFormat } from '../internal/intlFormat'
import { DateTimeDisplayOptions, OverflowOptions } from '../genericApi/options'
import { extractCalendarIdFromBag, refineCalendarSlotString } from '../genericApi/calendarSlotString'
import { PlainDateSlots, PlainMonthDaySlots } from '../genericApi/genericTypes'
import { createMonthDayModCalendarRecordIMPL, createMonthDayNewCalendarRecordIMPL, getDateModCalendarRecordIMPL } from '../genericApi/calendarRecordSimple'
import * as PlainMonthDayFuncs from '../genericApi/plainMonthDay'

export function create(
  isoMonth: number,
  isoDay: number,
  calendar?: string,
  referenceIsoYear?: number,
): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.create(
    refineCalendarSlotString,
    isoMonth,
    isoDay,
    calendar,
    referenceIsoYear,
  )
}

export function fromString(s: string): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.fromString(s) // just a passthrough
}

export function fromFields(
  fields: MonthDayBag & { calendar?: string },
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  const calendarMaybe = extractCalendarIdFromBag(fields)
  const calendar = calendarMaybe || isoCalendarId // TODO: DRY-up this logic

  return PlainMonthDayFuncs.fromFields(
    createMonthDayNewCalendarRecordIMPL,
    calendar,
    !calendarMaybe,
    fields,
    options,
  )
}

export function getFields(slots: PlainMonthDaySlots<string>): MonthDayFields {
  const calendarImpl = queryCalendarImpl(slots.calendar)
  const [, month, day] = calendarImpl.queryYearMonthDay(slots)

  return {
    month,
    monthCode: calendarImpl.monthCode(slots),
    day,
  }
}

export function withFields(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  modFields: MonthDayBag,
  options?: OverflowOptions,
): PlainMonthDaySlots<string> {
  return PlainMonthDayFuncs.withFields(
    createMonthDayModCalendarRecordIMPL,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    modFields,
    options,
  )
}

export function equals(
  plainMonthDaySlots0: PlainMonthDaySlots<string>,
  plainMonthDaySlots1: PlainMonthDaySlots<string>,
): boolean {
  return PlainMonthDayFuncs.equals(plainMonthDaySlots0, plainMonthDaySlots1)
}

export function toString(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  options?: DateTimeDisplayOptions,
): string {
  return PlainMonthDayFuncs.toString(plainMonthDaySlots, options)
}

export function toJSON(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
): string {
  return PlainMonthDayFuncs.toJSON(plainMonthDaySlots)
}

export function toPlainDate(
  plainMonthDaySlots: PlainMonthDaySlots<string>,
  bag: YearFields,
): PlainDateSlots<string> {
  return PlainMonthDayFuncs.toPlainDate(
    getDateModCalendarRecordIMPL,
    plainMonthDaySlots,
    getFields(plainMonthDaySlots),
    bag,
  )
}

export function toLocaleString(
  slots: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepCachedPlainMonthDayFormat(locales, options, slots)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  slots: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepCachedPlainMonthDayFormat(locales, options, slots)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainMonthDayFormat(locales, options, slots0, slots1)
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  slots0: PlainMonthDaySlots<string>,
  slots1: PlainMonthDaySlots<string>,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
  ): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepCachedPlainMonthDayFormat(locales, options, slots0, slots1)
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
