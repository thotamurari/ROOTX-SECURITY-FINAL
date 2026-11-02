import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    leftIcon?: ReactNode
    rightSlot?: ReactNode
}

/**
 * Labeled input primitive. Renders a native <input> under the hood so
 * value/onChange/type/disabled/etc. all pass through unchanged — this is a
 * styling wrapper only, no behavioral changes vs. a plain <input>.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
    { label, error, hint, leftIcon, rightSlot, id, className = '', ...props },
    ref
) {
    const autoId = useId()
    const inputId = id || autoId

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[11.5px] font-semibold uppercase tracking-wider text-text-tertiary ml-0.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                        {leftIcon}
                    </span>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    className={[
                        'input-field',
                        leftIcon ? 'pl-10' : '',
                        rightSlot ? 'pr-10' : '',
                        error ? '!border-danger focus:!ring-danger/30 focus:!border-danger' : '',
                        className,
                    ].join(' ')}
                    {...props}
                />
                {rightSlot && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary">
                        {rightSlot}
                    </span>
                )}
            </div>
            {error ? (
                <p id={`${inputId}-error`} className="text-[12px] text-danger ml-0.5">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${inputId}-hint`} className="text-[12px] text-text-tertiary ml-0.5">
                    {hint}
                </p>
            ) : null}
        </div>
    )
})
