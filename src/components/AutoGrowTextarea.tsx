import React, { useCallback, useLayoutEffect, useRef } from 'react';

interface AutoGrowTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  value: string;
  /** Minimum visible rows before the field starts growing. Defaults to 2. */
  minRows?: number;
  /** Optional max pixel height; beyond it the field scrolls instead of growing. */
  maxHeight?: number;
}

/**
 * Textarea that grows with its content, so long descriptions never get trapped
 * inside a tiny fixed-height box with a scrollbar.
 */
export const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
  ({ value, minRows = 2, maxHeight, className = '', style, onInput, ...rest }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const resize = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      // Include borders so the wrapped content is never clipped by a pixel or two.
      const borderSize = el.offsetHeight - el.clientHeight;
      const nextHeight = el.scrollHeight + borderSize;
      el.style.height = `${maxHeight ? Math.min(nextHeight, maxHeight) : nextHeight}px`;
      el.style.overflowY = maxHeight && nextHeight > maxHeight ? 'auto' : 'hidden';
    }, [maxHeight]);

    // Re-measure whenever the content changes (typing, programmatic set, task swap).
    useLayoutEffect(() => {
      resize();
    }, [value, resize]);

    // Re-measure when the window (and therefore the field width) changes.
    useLayoutEffect(() => {
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, [resize]);

    return (
      <textarea
        {...rest}
        ref={setRefs}
        value={value}
        rows={minRows}
        onInput={(e) => {
          resize();
          onInput?.(e);
        }}
        className={`resize-none overflow-hidden ${className}`}
        style={style}
      />
    );
  }
);

AutoGrowTextarea.displayName = 'AutoGrowTextarea';
