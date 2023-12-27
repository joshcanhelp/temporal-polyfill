import { DurationBag } from '../internal/calendarFields'
import { ensureString, toStrictInteger } from '../internal/cast'
import { MarkerSlots, absDuration, addToDuration, checkDurationFields, compareDurations, negateDuration, queryDurationSign, roundDuration, totalDuration } from '../internal/durationMath'
import { formatDurationIso } from '../internal/formatIso'
import { parseDuration } from '../internal/parseIso'
import { TimeZoneOps } from '../internal/timeZoneOps'
import { UnitName } from '../internal/units'
import { NumSign } from '../internal/utils'
import { DiffOps } from '../internal/calendarOps'
import { DurationRoundOptions, RelativeToOptions, TimeDisplayOptions, TotalUnitOptionsWithRel } from './optionsRefine'
import { DurationBranding, DurationSlots } from '../internal/slots'
import { mergeDurationBag, refineDurationBag } from '../internal/bag'

export function create(
  years: number = 0,
  months: number = 0,
  weeks: number = 0,
  days: number = 0,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0,
  milliseconds: number = 0,
  microseconds: number = 0,
  nanoseconds: number = 0,
): DurationSlots {
  return {
    ...checkDurationFields({
      years: toStrictInteger(years),
      months: toStrictInteger(months),
      weeks: toStrictInteger(weeks),
      days: toStrictInteger(days),
      hours: toStrictInteger(hours),
      minutes: toStrictInteger(minutes),
      seconds: toStrictInteger(seconds),
      milliseconds: toStrictInteger(milliseconds),
      microseconds: toStrictInteger(microseconds),
      nanoseconds: toStrictInteger(nanoseconds),
    }),
    branding: DurationBranding,
  }
}

export function fromString(s: string): DurationSlots {
  return {
    ...parseDuration(ensureString(s)),
    branding: DurationBranding,
  }
}

export function fromFields(fields: DurationBag): DurationSlots {
  return {
    ...refineDurationBag(fields),
    branding: DurationBranding,
  }
}

export function withFields(
  slots: DurationSlots,
  fields: DurationBag,
): DurationSlots {
  return {
    ...mergeDurationBag(slots, fields),
    branding: DurationBranding,
  }
}

export function add<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
  direction: -1 | 1 = 1,
): DurationSlots {
  return addToDuration(refineRelativeTo, getCalendarOps, getTimeZoneOps, slots, otherSlots, options, direction)
}

export function subtract<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  otherSlots: DurationSlots,
  options?: RelativeToOptions<RA>,
): DurationSlots {
  return add(refineRelativeTo, getCalendarOps, getTimeZoneOps, slots, otherSlots, options, -1)
}

export function negated(slots: DurationSlots): DurationSlots {
  return {
    ...negateDuration(slots),
    branding: DurationBranding,
  }
}

export function abs(slots: DurationSlots): DurationSlots {
  return {
    ...absDuration(slots),
    branding: DurationBranding,
  }
}

export function round<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: DurationRoundOptions<RA>,
): DurationSlots {
  return roundDuration(refineRelativeTo, getCalendarOps, getTimeZoneOps, slots, options)
}

export function total<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  slots: DurationSlots,
  options: TotalUnitOptionsWithRel<RA> | UnitName,
): number {
  return totalDuration(refineRelativeTo, getCalendarOps, getTimeZoneOps, slots, options)
}

export function toString(slots: DurationSlots, options?: TimeDisplayOptions): string {
  return formatDurationIso(slots, options)
}

export function toJSON(slots: DurationSlots): string {
  return toString(slots)
}

export function sign(slots: DurationSlots): NumSign {
  return queryDurationSign(slots) // TODO: just forward
}

export function blank(slots: DurationSlots): boolean {
  return !queryDurationSign(slots)
}

export function compare<RA, C, T>(
  refineRelativeTo: (relativeToArg: RA) => MarkerSlots<C, T> | undefined,
  getCalendarOps: (calendarSlot: C) => DiffOps,
  getTimeZoneOps: (timeZoneSlot: T) => TimeZoneOps,
  durationSlots0: DurationSlots,
  durationSlots1: DurationSlots,
  options?: RelativeToOptions<RA>,
): NumSign {
  return compareDurations(refineRelativeTo, getCalendarOps, getTimeZoneOps, durationSlots0, durationSlots1, options)
}
