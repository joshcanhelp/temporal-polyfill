import { gregoryCalendarId, isoCalendarId } from './calendarConfig'
import { gregoryDateModOps, gregoryDateRefineOps, gregoryMonthDayModOps, gregoryMonthDayRefineOps, gregoryPartOps, gregoryStandardOps, gregoryYearMonthModOps, gregoryYearMonthRefineOps } from './calendarGregory'
import { createCalendarIntlOps, intlDateModOps, intlDateRefineOps, intlDayOfYearOps, intlDaysInMonthOps, intlDaysInYearOps, intlDiffOps, intlInLeapYearOps, intlMonthDayModOps, intlMonthDayParseOps, intlMonthDayRefineOps, intlMonthsInYearOps, intlMoveOps, intlPartOps, intlStandardOps, intlYearMonthDiffOps, intlYearMonthModOps, intlYearMonthMoveOps, intlYearMonthParseOps, intlYearMonthRefineOps } from './calendarIntl'
import { isoDateModOps, isoDateRefineOps, isoDayOfYearOps, isoDaysInMonthOps, isoDaysInYearOps, isoDiffOps, isoInLeapYearOps, isoMonthDayModOps, isoMonthDayParseOps, isoMonthDayRefineOps, isoMonthsInYearOps, isoMoveOps, isoPartOps, isoStandardOps, isoYearMonthDiffOps, isoYearMonthModOps, isoYearMonthMoveOps, isoYearMonthParseOps, isoYearMonthRefineOps } from './calendarIso'

// Refine
export const createNativeYearMonthRefineOps = createNativeOpsCreator(isoYearMonthRefineOps, intlYearMonthRefineOps, gregoryYearMonthRefineOps)
export const createNativeDateRefineOps = createNativeOpsCreator(isoDateRefineOps, intlDateRefineOps, gregoryDateRefineOps)
export const createNativeMonthDayRefineOps = createNativeOpsCreator(isoMonthDayRefineOps, intlMonthDayRefineOps, gregoryMonthDayRefineOps)

// Mod
export const createNativeYearMonthModOps = createNativeOpsCreator(isoYearMonthModOps, intlYearMonthModOps, gregoryYearMonthModOps)
export const createNativeDateModOps = createNativeOpsCreator(isoDateModOps, intlDateModOps, gregoryDateModOps)
export const createNativeMonthDayModOps = createNativeOpsCreator(isoMonthDayModOps, intlMonthDayModOps, gregoryMonthDayModOps)

// Math
export const createNativeMoveOps = createNativeOpsCreator(isoMoveOps, intlMoveOps)
export const createNativeDiffOps = createNativeOpsCreator(isoDiffOps, intlDiffOps)
export const createNativeYearMonthMoveOps = createNativeOpsCreator(isoYearMonthMoveOps, intlYearMonthMoveOps)
export const createNativeYearMonthDiffOps = createNativeOpsCreator(isoYearMonthDiffOps, intlYearMonthDiffOps)

// Parts & Stats
export const createNativeInLeapYearOps = createNativeOpsCreator(isoInLeapYearOps, intlInLeapYearOps)
export const createNativeMonthsInYearOps = createNativeOpsCreator(isoMonthsInYearOps, intlMonthsInYearOps)
export const createNativeDaysInMonthOps = createNativeOpsCreator(isoDaysInMonthOps, intlDaysInMonthOps)
export const createNativeDaysInYearOps = createNativeOpsCreator(isoDaysInYearOps, intlDaysInYearOps)
export const createNativeDayOfYearOps = createNativeOpsCreator(isoDayOfYearOps, intlDayOfYearOps)
export const createNativePartOps = createNativeOpsCreator(isoPartOps, intlPartOps, gregoryPartOps)

// String Parsing
export const createNativeYearMonthParseOps = createNativeOpsCreator(isoYearMonthParseOps, intlYearMonthParseOps)
export const createNativeMonthDayParseOps = createNativeOpsCreator(isoMonthDayParseOps, intlMonthDayParseOps)

// Standard
export const createNativeStandardOps = createNativeOpsCreator(isoStandardOps, intlStandardOps, gregoryStandardOps)

function createNativeOpsCreator<O extends {}>(
  isoOps: O,
  intlOps: O,
  gregoryOps?: O,
): (
  (calendarId: string) => O
) {
  return (calendarId) => {
    if (calendarId === isoCalendarId) {
      return isoOps
    } else if (calendarId === gregoryCalendarId) {
      return gregoryOps || isoOps
    }
    return createCalendarIntlOps(calendarId, intlOps)
  }
}
