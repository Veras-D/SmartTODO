/**
 * Clipboard guard for the Tauri/WebKitGTK webview.
 *
 * Copying from the page sometimes puts a much larger payload (page HTML, hidden
 * nodes, surrounding text) on the clipboard instead of just the highlighted
 * text. That shows up as "the wrong thing was copied" in clipboard managers and
 * makes pasting into terminals sluggish.
 *
 * This installs a document-level `copy` / `cut` handler that writes exactly the
 * selected characters as `text/plain` and nothing else.
 */
export function installPlainTextClipboard(): () => void {
  const textFromField = (element: Element | null): string => {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const { selectionStart, selectionEnd, value } = element;
      if (selectionStart !== null && selectionEnd !== null && selectionEnd > selectionStart) {
        return value.slice(selectionStart, selectionEnd);
      }
    }
    return '';
  };

  const getSelectionText = (target: EventTarget | null): string => {
    // 1. The focused control's own selection (notes, descriptions, inputs...)
    const fromTarget = textFromField(target as Element | null);
    if (fromTarget) return fromTarget;

    // 2. A normal text selection anywhere on the page
    const fromPage = window.getSelection()?.toString() ?? '';
    if (fromPage) return fromPage;

    // 3. Fallback: the focused element, in case the event target is <body>
    return textFromField(document.activeElement);
  };

  const handleCopy = (event: ClipboardEvent) => {
    const text = getSelectionText(event.target);
    // Nothing selected: let the webview do its default thing
    if (!text) return;

    event.clipboardData?.setData('text/plain', text);
    // Drop every other flavour (text/html etc.) that bloats the payload
    event.preventDefault();
  };

  const handleCut = (event: ClipboardEvent) => {
    const text = getSelectionText(event.target);
    if (!text) return;

    event.clipboardData?.setData('text/plain', text);
    // No preventDefault here: the field must still delete the selection
  };

  document.addEventListener('copy', handleCopy);
  document.addEventListener('cut', handleCut);

  return () => {
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('cut', handleCut);
  };
}

/**
 * Copy an arbitrary string as plain text.
 *
 * navigator.clipboard is permission-gated and missing in some WebKitGTK
 * builds, so fall back to the classic hidden-textarea + execCommand path.
 * Focus is restored to whatever the user was on before.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  const previouslyFocused = document.activeElement as HTMLElement | null;
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  } finally {
    previouslyFocused?.focus?.();
  }
}
