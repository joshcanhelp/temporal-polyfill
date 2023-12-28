import { DayTimeNano } from './dayTimeNano'
import { DurationFields } from './durationFields'
import { IsoDateFields, IsoDateTimeFields, IsoTimeFields, isoDateTimeFieldNamesAlpha } from './calendarIsoFields'
import { ensureString } from './cast'
import { isoCalendarId } from './calendarConfig'
import { parseCalendarId, parseMaybeOffsetNano, parseTimeZoneId, realizeCalendarId, realizeTimeZoneId } from './parseIso'
import { utcTimeZoneId } from './timeZoneNative'
import { SimpleTimeZoneOps, zonedInternalsToIso } from './timeZoneOps'
import { pluckProps } from './utils'
import { formatOffsetNano } from './formatIso'

export const PlainYearMonthBranding = 'PlainYearMonth' as const
export const PlainMonthDayBranding = 'PlainMonthDay' as const
export const PlainDateBranding = 'PlainDate' as const
export const PlainDateTimeBranding = 'PlainDateTime' as const
export const PlainTimeBranding = 'PlainTime' as const
export const ZonedDateTimeBranding = 'ZonedDateTime' as const
export const InstantBranding = 'Instant' as const
export const DurationBranding = 'Duration' as const
export const CalendarBranding = 'Calendar' as const
export const TimeZoneBranding = 'TimeZone' as const

export interface BrandingSlots {
  branding: string
}

export interface EpochSlots {
  epochNanoseconds: DayTimeNano
}

export type PlainDateSlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainDateBranding }
export type PlainTimeSlots = IsoTimeFields & { branding: typeof PlainTimeBranding }
export type PlainDateTimeSlots<C> = IsoDateTimeFields & { calendar: C, branding: typeof PlainDateTimeBranding }
export type ZonedDateTimeSlots<C, T> = { epochNanoseconds: DayTimeNano, calendar: C, timeZone: T, branding: typeof ZonedDateTimeBranding }
export type PlainMonthDaySlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainMonthDayBranding }
export type PlainYearMonthSlots<C> = IsoDateFields & { calendar: C, branding: typeof PlainYearMonthBranding }
export type DurationSlots = DurationFields & { branding: typeof DurationBranding }
export type InstantSlots = { epochNanoseconds: DayTimeNano, branding: typeof InstantBranding }

// Calendar
// -------------------------------------------------------------------------------------------------

export function getCommonCalendarSlot<C extends IdLike>(a: C, b: C): C {
  if (!isIdLikeEqual(a, b)) {
    throw new RangeError('Calendars must be the same')
  }

  return a
}

export function getPreferredCalendarSlot<C extends IdLike>(a: C, b: C): C {
  // fast path. doesn't read IDs
  // similar to isIdLikeEqual
  if (a === b) {
    return a
  }

  const aId = getId(a)
  const bId = getId(b)

  if (aId === bId || aId === isoCalendarId) {
    return b
  } else if (bId === isoCalendarId) {
    return a
  }

  throw new RangeError('Incompatible calendars')
}

export function refineCalendarSlotString(calendarArg: string): string {
  return realizeCalendarId(parseCalendarId(ensureString(calendarArg)))
}

// bag
// ---

export function getCalendarIdFromBag(bag: { calendar?: string }): string {
  return extractCalendarIdFromBag(bag) || isoCalendarId
}

export function extractCalendarIdFromBag(bag: { calendar?: string }): string | undefined {
  const { calendar } = bag
  if (calendar !== undefined) {
    return refineCalendarSlotString(calendar)
  }
}

// TimeZone
// -------------------------------------------------------------------------------------------------

export function getCommonTimeZoneSlot<C extends IdLike>(a: C, b: C): C {
  if (!isTimeZoneSlotsEqual(a, b, true)) {
    throw new RangeError('TimeZones must be the same')
  }

  return a
}

export function isTimeZoneSlotsEqual(a: IdLike, b: IdLike, loose?: boolean): boolean {
  return a === b || getTimeZoneSlotRaw(a, loose) === getTimeZoneSlotRaw(b, loose)
}

/*
TODO: pre-parse offset somehow? not very performant
*/
function getTimeZoneSlotRaw(slot: IdLike, loose?: boolean): string | number {
  const id = getId(slot)

  if (loose && id === utcTimeZoneId) {
    return 0
  }

  const offsetNano = parseMaybeOffsetNano(id)
  if (offsetNano !== undefined) {
    return offsetNano
  }

  return id
}

export function refineTimeZoneSlotString(arg: string): string {
  return realizeTimeZoneId(parseTimeZoneId(ensureString(arg)))
}

// ID-like
// -------------------------------------------------------------------------------------------------

export type IdLike = string | { id: string }

export function getId(idLike: IdLike): string {
  return typeof idLike === 'string' ? idLike : ensureString(idLike.id)
}

export function isIdLikeEqual(
  calendarSlot0: IdLike,
  calendarSlot1: IdLike,
): boolean {
  return calendarSlot0 === calendarSlot1 || getId(calendarSlot0) === getId(calendarSlot1)
}

// getISOFields()
// -------------------------------------------------------------------------------------------------

export function getPublicZonedDateTimeFields<C, T>(
  getTimeZoneOps: (timeZoneSlot: T) => SimpleTimeZoneOps,
  zonedDateTimeSlots: ZonedDateTimeSlots<C, T>,
): IsoDateTimeFields & { calendar: C, timeZone: T, offset: string } {
  const isoFields = zonedInternalsToIso(zonedDateTimeSlots as any, getTimeZoneOps(zonedDateTimeSlots.timeZone))

  return { // alphabetical
    calendar: zonedDateTimeSlots.calendar,
    ...pluckProps(isoDateTimeFieldNamesAlpha, isoFields),
    offset: formatOffsetNano(isoFields.offsetNanoseconds), // TODO: more DRY
    timeZone: zonedDateTimeSlots.timeZone,
  }
}
