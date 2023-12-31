import { Classlike, createLazyGenerator, defineProps, pluckProps } from '../internal/utils'
import { OrigDateTimeFormat, LocalesArg, OptionNames, ClassFormatConfig, plainYearMonthConfig, plainMonthDayConfig, plainDateConfig, plainDateTimeConfig, plainTimeConfig, instantConfig, createFormatPrepper, zonedDateTimeConfig, toEpochMillis } from '../internal/formatIntl'
import { ZonedDateTime } from './zonedDateTime'
import { PlainDate } from './plainDate'
import { PlainTime } from './plainTime'
import { PlainDateTime } from './plainDateTime'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { Instant } from './instant'
import { getSlots } from './slotsForClasses'
import { BrandingSlots } from '../internal/slots'
import * as errorMessages from '../internal/errorMessages'

type OrigFormattable = number | Date
type TemporalFormattable = Instant |
  PlainDate |
  PlainDateTime |
  ZonedDateTime |
  PlainYearMonth |
  PlainMonthDay |
  PlainTime

export type Formattable = TemporalFormattable | OrigFormattable

const prepSubformatMap = new WeakMap<DateTimeFormat, BoundFormatPrepFunc>()

// Intl.DateTimeFormat
// -------------------------------------------------------------------------------------------------

export class DateTimeFormat extends OrigDateTimeFormat {
  constructor(locales: LocalesArg, options: Intl.DateTimeFormatOptions = {}) {
    super(locales, options)

    // Copy options so accessing doesn't cause side-effects
    // Must store recursively flattened options because given `options` could mutate in future
    // Algorithm: whitelist against resolved options
    const resolvedOptions = this.resolvedOptions()
    const origOptions = pluckProps(
      Object.keys(options) as OptionNames,
      resolvedOptions as Intl.DateTimeFormatOptions
    )

    prepSubformatMap.set(this, createBoundFormatPrepFunc(origOptions, resolvedOptions))
  }

  format(arg?: Formattable): string {
    const prepSubformat = prepSubformatMap.get(this)!
    const [format, epochMilli] = prepSubformat(arg)

    // can't use the origMethod.call() trick because .format() is always bound
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    return format
      ? format.format(epochMilli)
      : super.format(arg as OrigFormattable)
  }

  formatToParts(arg?: Formattable): Intl.DateTimeFormatPart[] {
    const prepSubformat = prepSubformatMap.get(this)!
    const [format, epochMilli] = prepSubformat(arg)

    return format
      ? format.formatToParts(epochMilli)
      : super.formatToParts(arg as OrigFormattable)
  }
}

export interface DateTimeFormat {
  formatRange(arg0: Formattable, arg1: Formattable): string
  formatRangeToParts(arg0: Formattable, arg1: Formattable): Intl.DateTimeFormatPart[]
}

;['formatRange', 'formatRangeToParts'].forEach((methodName) => {
  const origMethod = (OrigDateTimeFormat as Classlike).prototype[methodName]

  if (origMethod) {
    defineProps(DateTimeFormat.prototype, {
      [methodName]: function (this: DateTimeFormat, arg0: Formattable, arg1: Formattable) {
        const prepSubformat = prepSubformatMap.get(this)!
        const [format, epochMilli0, epochMilli1] = prepSubformat(arg0, arg1)

        return format
          ? origMethod.call(format, epochMilli0, epochMilli1)
          : origMethod.call(this, arg0, arg1)
      }
    })
  }
})

// Format Prepping for Intl.DateTimeFormat ("Bound")
// -------------------------------------------------------------------------------------------------

type BoundFormatPrepFunc = ( // already bound to locale/options
  arg0?: Formattable,
  arg1?: Formattable
) => BoundFormatPrepFuncRes

type BoundFormatPrepFuncRes = [
  Intl.DateTimeFormat | undefined,
  number | undefined,
  number | undefined,
]

const classFormatConfigs: Record<string, ClassFormatConfig<any>> = {
  PlainYearMonth: plainYearMonthConfig,
  PlainMonthDay: plainMonthDayConfig,
  PlainDate: plainDateConfig,
  PlainDateTime: plainDateTimeConfig,
  PlainTime: plainTimeConfig,
  Instant: instantConfig,
  // ZonedDateTime not allowed to be formatted by Intl.DateTimeFormat
}

function createBoundFormatPrepFunc(
  origOptions: Intl.DateTimeFormatOptions,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
): BoundFormatPrepFunc {
  const resolvedLocale = resolvedOptions.locale

  const queryFormat = createLazyGenerator((branding: string) => {
    const [transformOptions] = classFormatConfigs[branding]
    const transformedOptions = transformOptions(origOptions)
    return new OrigDateTimeFormat(resolvedLocale, transformedOptions)
  })

  return (arg0, arg1) => {
    const slots0 = getSlots(arg0)
    const { branding } = slots0 || {}
    let slots1: BrandingSlots | undefined

    if (arg1 !== undefined) {
      slots1 = getSlots(arg1)

      if (branding !== (slots1 || {}).branding) {
        throw new TypeError(errorMessages.mismatchingFormatTypes)
      }
    }

    if (branding) {
      const config = classFormatConfigs[branding]
      if (!config) {
        throw new TypeError(errorMessages.invalidFormatType(branding))
      }

      return [
        queryFormat(branding)!,
        ...toEpochMillis(config, resolvedOptions, slots0, slots1),
      ] as BoundFormatPrepFuncRes
    }

    return [] as unknown as BoundFormatPrepFuncRes
  }
}

// Format Prepping for each class' toLocaleString
// (best place for this?)
// -------------------------------------------------------------------------------------------------

export const prepPlainYearMonthFormat = createFormatPrepper(plainYearMonthConfig)
export const prepPlainMonthDayFormat = createFormatPrepper(plainMonthDayConfig)
export const prepPlainDateFormat = createFormatPrepper(plainDateConfig)
export const prepPlainDateTimeFormat = createFormatPrepper(plainDateTimeConfig)
export const prepPlainTimeFormat = createFormatPrepper(plainTimeConfig)
export const prepInstantFormat = createFormatPrepper(instantConfig)
export const prepZonedDateTimeFormat = createFormatPrepper(zonedDateTimeConfig)
