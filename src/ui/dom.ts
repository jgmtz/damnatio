// Tiny DOM helper to keep UI code declarative without a framework.

type Child = Node | string | null | undefined | false;

interface Props {
  class?: string;
  text?: string;
  attrs?: Record<string, string>;
  on?: Partial<Record<keyof HTMLElementEventMap, (event: Event) => void>>;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [name, value] of Object.entries(props.attrs ?? {})) node.setAttribute(name, value);
  for (const [event, handler] of Object.entries(props.on ?? {})) {
    if (handler) node.addEventListener(event, handler);
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}
