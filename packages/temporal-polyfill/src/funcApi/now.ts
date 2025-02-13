import { isoCalendarId } from '../internal/calendarConfig'
import {
  getCurrentEpochNano,
  getCurrentIsoDateTime,
  getCurrentTimeZoneId,
} from '../internal/current'
import {
  InstantSlots,
  PlainDateSlots,
  PlainDateTimeSlots,
  PlainTimeSlots,
  ZonedDateTimeSlots,
  createInstantSlots,
  createPlainDateSlots,
  createPlainDateTimeSlots,
  createPlainTimeSlots,
  createZonedDateTimeSlots,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { refineCalendarIdString, refineTimeZoneIdString } from './utils'

export const timeZoneId = getCurrentTimeZoneId

export function instant(): InstantSlots {
  return createInstantSlots(getCurrentEpochNano())
}

export function zonedDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    refineTimeZoneIdString(timeZoneId),
    refineCalendarIdString(calendarId),
  )
}

export function zonedDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): ZonedDateTimeSlots<string, string> {
  return createZonedDateTimeSlots(
    getCurrentEpochNano(),
    refineTimeZoneIdString(timeZoneId),
    isoCalendarId,
  )
}

export function plainDateTime(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    refineCalendarIdString(calendarId),
  )
}

export function plainDateTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateTimeSlots<string> {
  return createPlainDateTimeSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    isoCalendarId,
  )
}

export function plainDate(
  calendarId: string,
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return createPlainDateSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    refineCalendarIdString(calendarId),
  )
}

export function plainDateISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainDateSlots<string> {
  return createPlainDateSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
    isoCalendarId,
  )
}

export function plainTimeISO(
  timeZoneId: string = getCurrentTimeZoneId(),
): PlainTimeSlots {
  return createPlainTimeSlots(
    getCurrentIsoDateTime(
      queryNativeTimeZone(refineTimeZoneIdString(timeZoneId)),
    ),
  )
}
