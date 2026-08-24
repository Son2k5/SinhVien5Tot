/**
 * Batch converter: [property:value] CSS syntax → Tailwind utility classes
 * 
 * Run with: node scripts/convert-css-to-tw.mjs
 * 
 * Converts arbitrary CSS value syntax like [display:flex] to proper
 * Tailwind utilities like `flex`, preserving exact values.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function splitCssList(value, separator) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const char of value) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function convertTransition(value) {
  const transitions = splitCssList(value, ',').map((part) => splitCssList(part, '_'));
  const properties = [];
  const durations = [];
  const timings = [];
  const delays = [];
  const timingPattern = /^(?:ease|linear|ease-in|ease-out|ease-in-out|step-start|step-end|cubic-bezier\(.+\)|steps\(.+\))$/;
  const timePattern = /^-?(?:\d*\.)?\d+m?s$/;

  for (const tokens of transitions) {
    let property = 'all';
    let duration = '0s';
    let timing = 'ease';
    let delay = '0s';
    let timeCount = 0;
    for (const token of tokens.filter(Boolean)) {
      if (timePattern.test(token)) {
        if (timeCount++ === 0) duration = token;
        else delay = token;
      } else if (timingPattern.test(token)) {
        timing = token;
      } else {
        property = token;
      }
    }
    properties.push(property);
    durations.push(duration);
    timings.push(timing);
    delays.push(delay);
  }

  const propertyClass = properties.length === 1 && properties[0] === 'all'
    ? 'transition-all'
    : `transition-[${properties.join(',')}]`;
  const classes = [propertyClass, `duration-[${durations.join(',')}]`, `ease-[${timings.join(',')}]`];
  if (delays.some((delay) => delay !== '0s')) classes.push(`delay-[${delays.join(',')}]`);
  return classes.join(' ');
}

// ──── Mapping rules ────
// Each rule: [regex pattern on the bracketed token, replacement string]
// Order matters — more specific patterns first.
const RULES = [
  // display
  [/^\[display:flex\]$/, 'flex'],
  [/^\[display:inline-flex\]$/, 'inline-flex'],
  [/^\[display:grid\]$/, 'grid'],
  [/^\[display:inline-grid\]$/, 'inline-grid'],
  [/^\[display:block\]$/, 'block'],
  [/^\[display:inline-block\]$/, 'inline-block'],
  [/^\[display:inline\]$/, 'inline'],
  [/^\[display:none\]$/, 'hidden'],
  [/^\[display:contents\]$/, 'contents'],
  [/^\[display:initial\]$/, 'inline'],
  // position
  [/^\[position:relative\]$/, 'relative'],
  [/^\[position:absolute\]$/, 'absolute'],
  [/^\[position:fixed\]$/, 'fixed'],
  [/^\[position:sticky\]$/, 'sticky'],
  [/^\[position:static\]$/, 'static'],
  // overflow
  [/^\[overflow:hidden\]$/, 'overflow-hidden'],
  [/^\[overflow:clip\]$/, 'overflow-clip'],
  [/^\[overflow:auto\]$/, 'overflow-auto'],
  [/^\[overflow:scroll\]$/, 'overflow-scroll'],
  [/^\[overflow:visible\]$/, 'overflow-visible'],
  [/^\[overflow-x:auto\]$/, 'overflow-x-auto'],
  [/^\[overflow-x:hidden\]$/, 'overflow-x-hidden'],
  [/^\[overflow-y:auto\]$/, 'overflow-y-auto'],
  [/^\[overflow-y:hidden\]$/, 'overflow-y-hidden'],
  // flex-direction
  [/^\[flex-direction:column\]$/, 'flex-col'],
  [/^\[flex-direction:row\]$/, 'flex-row'],
  [/^\[flex-direction:column-reverse\]$/, 'flex-col-reverse'],
  [/^\[flex-direction:row-reverse\]$/, 'flex-row-reverse'],
  // flex-wrap
  [/^\[flex-wrap:wrap\]$/, 'flex-wrap'],
  [/^\[flex-wrap:nowrap\]$/, 'flex-nowrap'],
  [/^\[flex-wrap:wrap-reverse\]$/, 'flex-wrap-reverse'],
  // flex shorthand
  [/^\[flex:1\]$/, 'flex-1'],
  [/^\[flex:auto\]$/, 'flex-auto'],
  [/^\[flex:none\]$/, 'flex-none'],
  [/^\[flex:0_0_auto\]$/, 'flex-none'],
  [/^\[flex:([^\]]+)\]$/, (_, v) => `flex-[${v}]`],
  // flex-shrink / flex-grow
  [/^\[flex-shrink:0\]$/, 'shrink-0'],
  [/^\[flex-grow:0\]$/, 'grow-0'],
  [/^\[flex-grow:1\]$/, 'grow'],
  // align-items
  [/^\[align-items:center\]$/, 'items-center'],
  [/^\[align-items:flex-start\]$/, 'items-start'],
  [/^\[align-items:flex-end\]$/, 'items-end'],
  [/^\[align-items:baseline\]$/, 'items-baseline'],
  [/^\[align-items:stretch\]$/, 'items-stretch'],
  [/^\[align-items:(start|end|initial)\]$/, (_, v) => `items-[${v}]`],
  // align-self
  [/^\[align-self:center\]$/, 'self-center'],
  [/^\[align-self:flex-start\]$/, 'self-start'],
  [/^\[align-self:flex-end\]$/, 'self-end'],
  [/^\[align-self:stretch\]$/, 'self-stretch'],
  [/^\[align-self:(start|end|initial)\]$/, (_, v) => `self-[${v}]`],
  // justify-content
  [/^\[justify-content:center\]$/, 'justify-center'],
  [/^\[justify-content:space-between\]$/, 'justify-between'],
  [/^\[justify-content:space-around\]$/, 'justify-around'],
  [/^\[justify-content:flex-start\]$/, 'justify-start'],
  [/^\[justify-content:flex-end\]$/, 'justify-end'],
  [/^\[justify-content:(stretch|start|end|initial)\]$/, (_, v) => `justify-[${v}]`],
  // place-items
  [/^\[place-items:center\]$/, 'place-items-center'],
  [/^\[place-content:center\]$/, 'place-content-center'],
  [/^\[justify-items:center\]$/, 'justify-items-center'],
  [/^\[justify-items:start\]$/, 'justify-items-start'],
  [/^\[justify-items:end\]$/, 'justify-items-end'],
  [/^\[justify-items:stretch\]$/, 'justify-items-stretch'],
  [/^\[justify-self:center\]$/, 'justify-self-center'],
  [/^\[justify-self:start\]$/, 'justify-self-start'],
  [/^\[justify-self:end\]$/, 'justify-self-end'],
  [/^\[justify-self:stretch\]$/, 'justify-self-stretch'],
  [/^\[align-content:center\]$/, 'content-center'],
  [/^\[align-content:flex-start\]$/, 'content-start'],
  [/^\[align-content:flex-end\]$/, 'content-end'],
  [/^\[align-content:space-between\]$/, 'content-between'],
  [/^\[align-content:space-around\]$/, 'content-around'],
  [/^\[align-content:space-evenly\]$/, 'content-evenly'],
  [/^\[align-content:(start|end|stretch|initial)\]$/, (_, v) => `content-[${v}]`],
  [/^\[justify-items:initial\]$/, 'justify-items-[initial]'],
  // text-align
  [/^\[text-align:center\]$/, 'text-center'],
  [/^\[text-align:left\]$/, 'text-left'],
  [/^\[text-align:right\]$/, 'text-right'],
  // text-transform
  [/^\[text-transform:uppercase\]$/, 'uppercase'],
  [/^\[text-transform:lowercase\]$/, 'lowercase'],
  [/^\[text-transform:capitalize\]$/, 'capitalize'],
  [/^\[text-transform:none\]$/, 'normal-case'],
  // text-decoration
  [/^\[text-decoration:none\]$/, 'no-underline'],
  [/^\[text-decoration:underline\]$/, 'underline'],
  [/^\[text-decoration:line-through\]$/, 'line-through'],
  // white-space
  [/^\[white-space:nowrap\]$/, 'whitespace-nowrap'],
  [/^\[white-space:pre\]$/, 'whitespace-pre'],
  [/^\[white-space:pre-wrap\]$/, 'whitespace-pre-wrap'],
  [/^\[white-space:normal\]$/, 'whitespace-normal'],
  // word-break / overflow-wrap
  [/^\[word-break:break-all\]$/, 'break-all'],
  [/^\[overflow-wrap:break-word\]$/, 'break-words'],
  // cursor
  [/^\[cursor:pointer\]$/, 'cursor-pointer'],
  [/^\[cursor:not-allowed\]$/, 'cursor-not-allowed'],
  [/^\[cursor:default\]$/, 'cursor-default'],
  [/^\[cursor:wait\]$/, 'cursor-wait'],
  [/^\[cursor:text\]$/, 'cursor-text'],
  [/^\[cursor:grab\]$/, 'cursor-grab'],
  // pointer-events
  [/^\[pointer-events:none\]$/, 'pointer-events-none'],
  [/^\[pointer-events:auto\]$/, 'pointer-events-auto'],
  // visibility
  [/^\[visibility:hidden\]$/, 'invisible'],
  [/^\[visibility:visible\]$/, 'visible'],
  // font-style
  [/^\[font-style:normal\]$/, 'not-italic'],
  [/^\[font-style:italic\]$/, 'italic'],
  // font-weight
  [/^\[font-weight:100\]$/, 'font-thin'],
  [/^\[font-weight:200\]$/, 'font-extralight'],
  [/^\[font-weight:300\]$/, 'font-light'],
  [/^\[font-weight:400\]$/, 'font-normal'],
  [/^\[font-weight:500\]$/, 'font-medium'],
  [/^\[font-weight:600\]$/, 'font-semibold'],
  [/^\[font-weight:700\]$/, 'font-bold'],
  [/^\[font-weight:800\]$/, 'font-extrabold'],
  [/^\[font-weight:900\]$/, 'font-black'],
  [/^\[font-weight:([^\]]+)\]$/, (_, v) => `font-[${v}]`],
  // resize
  [/^\[resize:vertical\]$/, 'resize-y'],
  [/^\[resize:horizontal\]$/, 'resize-x'],
  [/^\[resize:both\]$/, 'resize'],
  [/^\[resize:none\]$/, 'resize-none'],
  // object-fit
  [/^\[object-fit:cover\]$/, 'object-cover'],
  [/^\[object-fit:contain\]$/, 'object-contain'],
  [/^\[object-fit:fill\]$/, 'object-fill'],
  [/^\[object-fit:none\]$/, 'object-none'],
  // isolation
  [/^\[isolation:isolate\]$/, 'isolate'],
  // user-select
  [/^\[user-select:none\]$/, 'select-none'],
  [/^\[user-select:text\]$/, 'select-text'],
  [/^\[user-select:all\]$/, 'select-all'],
  // box-sizing
  [/^\[box-sizing:border-box\]$/, 'box-border'],
  // list-style
  [/^\[list-style:none\]$/, 'list-none'],
  [/^\[border-collapse:collapse\]$/, 'border-collapse'],
  [/^\[border-collapse:separate\]$/, 'border-separate'],
  [/^\[float:left\]$/, 'float-left'],
  [/^\[float:right\]$/, 'float-right'],
  [/^\[float:none\]$/, 'float-none'],
  // appearance
  [/^\[appearance:none\]$/, 'appearance-none'],
  // inset
  [/^\[inset:0\]$/, 'inset-0'],
  // margin: 0
  [/^\[margin:0\]$/, 'm-0'],
  [/^\[margin-top:0\]$/, 'mt-0'],
  [/^\[margin-bottom:0\]$/, 'mb-0'],
  [/^\[margin-left:0\]$/, 'ml-0'],
  [/^\[margin-right:0\]$/, 'mr-0'],
  [/^\[margin:0_auto\]$/, 'mx-auto my-0'],
  [/^\[margin-inline:auto\]$/, 'mx-auto'],
  [/^\[margin-top:auto\]$/, 'mt-auto'],
  [/^\[margin-bottom:auto\]$/, 'mb-auto'],
  // padding: 0
  [/^\[padding:0\]$/, 'p-0'],
  // width/height: 100%
  [/^\[width:100%\]$/, 'w-full'],
  [/^\[height:100%\]$/, 'h-full'],
  [/^\[width:auto\]$/, 'w-auto'],
  [/^\[height:auto\]$/, 'h-auto'],
  // min-width / min-height
  [/^\[min-width:0\]$/, 'min-w-0'],
  [/^\[min-height:0\]$/, 'min-h-0'],
  [/^\[min-height:100vh\]$/, 'min-h-screen'],
  [/^\[min-height:100dvh\]$/, 'min-h-dvh'],
  // max-width / max-height
  [/^\[max-width:100%\]$/, 'max-w-full'],
  [/^\[max-width:none\]$/, 'max-w-none'],
  // border: 0 / none
  [/^\[border:0\]$/, 'border-0'],
  [/^\[border:none\]$/, 'border-none'],
  // outline: none / 0
  [/^\[outline:none\]$/, 'outline-none'],
  [/^\[outline:0\]$/, 'outline-none'],
  // opacity standard values
  [/^\[opacity:0\]$/, 'opacity-0'],
  [/^\[opacity:1\]$/, 'opacity-100'],
  [/^\[opacity:0\.5\]$/, 'opacity-50'],
  // border-radius: 50%
  [/^\[border-radius:50%\]$/, 'rounded-full'],
  [/^\[border-radius:99px\]$/, 'rounded-full'],
  [/^\[border-radius:9999px\]$/, 'rounded-full'],
  // color keywords
  [/^\[color:white\]$/, 'text-white'],
  [/^\[color:#fff\]$/, 'text-white'],
  [/^\[color:#ffffff\]$/i, 'text-white'],
  [/^\[color:transparent\]$/, 'text-transparent'],
  [/^\[color:inherit\]$/, 'text-inherit'],
  [/^\[color:currentColor\]$/i, 'text-current'],
  // background keywords
  [/^\[background:transparent\]$/, 'bg-transparent'],
  [/^\[background:none\]$/, 'bg-none'],
  [/^\[background:white\]$/, 'bg-white'],
  [/^\[background:#fff\]$/, 'bg-white'],
  [/^\[background:#ffffff\]$/i, 'bg-white'],
  // scrollbar-width
  [/^\[scrollbar-width:none\]$/, 'scrollbar-none'],
  // text-wrap
  [/^\[text-wrap:balance\]$/, 'text-balance'],
  [/^\[text-wrap:pretty\]$/, 'text-pretty'],
  [/^\[animation:none\]$/, 'animate-none'],
  [/^\[font-variant-numeric:tabular-nums\]$/, 'tabular-nums'],
  [/^\[font-variant-numeric:normal\]$/, 'normal-nums'],
  [/^\[break-inside:avoid\]$/, 'break-inside-avoid'],
  [/^\[break-inside:avoid-page\]$/, 'break-inside-avoid-page'],
  [/^\[break-inside:avoid-column\]$/, 'break-inside-avoid-column'],

  // ── Generic value-preserving conversions ──
  // These use capture groups to preserve the actual values

  // color → text-[value]
  [/^\[color:(#[0-9a-fA-F]+)\]$/, (_, v) => `text-[${v}]`],
  [/^\[color:(rgba?\([^)]+\))\]$/, (_, v) => `text-[${v}]`],
  [/^\[color:(var\([^)]+\))\]$/, (_, v) => `text-[${v}]`],
  [/^\[color:([^\]]+)\]$/, (_, v) => `text-[${v}]`],

  // font-size → text-[value]
  [/^\[font-size:(\d+(?:\.\d+)?px)\]$/, (_, v) => `text-[${v}]`],
  [/^\[font-size:(\d+(?:\.\d+)?rem)\]$/, (_, v) => `text-[${v}]`],
  [/^\[font-size:(clamp\([^)]+\))\]$/, (_, v) => `text-[${v}]`],
  [/^\[font-size:(inherit)\]$/, () => 'text-inherit'],
  [/^\[font-size:([^\]]+)\]$/, (_, v) => `text-[${v}]`],

  // line-height → leading-[value]
  [/^\[line-height:([^\]]+)\]$/, (_, v) => `leading-[${v}]`],
  // letter-spacing → tracking-[value]
  [/^\[letter-spacing:([^\]]+)\]$/, (_, v) => `tracking-[${v}]`],

  // background (complex) → bg-[value]
  [/^\[background:([^\]]+)\]$/, (_, v) => `bg-[${v}]`],
  // background-color → bg-[value]
  [/^\[background-color:([^\]]+)\]$/, (_, v) => `bg-[${v}]`],
  [/^\[background-image:([^\]]+)\]$/, (_, v) => `bg-[image:${v}]`],
  [/^\[background-size:([^\]]+)\]$/, (_, v) => `bg-[length:${v}]`],

  // width → w-[value]
  [/^\[width:([^\]]+)\]$/, (_, v) => `w-[${v}]`],
  // height → h-[value]
  [/^\[height:([^\]]+)\]$/, (_, v) => `h-[${v}]`],
  // min-width → min-w-[value]
  [/^\[min-width:([^\]]+)\]$/, (_, v) => `min-w-[${v}]`],
  // min-height → min-h-[value]
  [/^\[min-height:([^\]]+)\]$/, (_, v) => `min-h-[${v}]`],
  // max-width → max-w-[value]
  [/^\[max-width:([^\]]+)\]$/, (_, v) => `max-w-[${v}]`],
  // max-height → max-h-[value]
  [/^\[max-height:([^\]]+)\]$/, (_, v) => `max-h-[${v}]`],

  // padding (single value) → p-[value]
  [/^\[padding:([^\]]+)\]$/, (_, v) => `p-[${v}]`],
  [/^\[padding-top:([^\]]+)\]$/, (_, v) => `pt-[${v}]`],
  [/^\[padding-right:([^\]]+)\]$/, (_, v) => `pr-[${v}]`],
  [/^\[padding-bottom:([^\]]+)\]$/, (_, v) => `pb-[${v}]`],
  [/^\[padding-left:([^\]]+)\]$/, (_, v) => `pl-[${v}]`],
  [/^\[padding-inline:([^\]]+)\]$/, (_, v) => `px-[${v}]`],
  [/^\[padding-block:([^\]]+)\]$/, (_, v) => `py-[${v}]`],

  // margin → m-[value]
  [/^\[margin:([^\]]+)\]$/, (_, v) => `m-[${v}]`],
  [/^\[margin-top:([^\]]+)\]$/, (_, v) => `mt-[${v}]`],
  [/^\[margin-right:([^\]]+)\]$/, (_, v) => `mr-[${v}]`],
  [/^\[margin-bottom:([^\]]+)\]$/, (_, v) => `mb-[${v}]`],
  [/^\[margin-left:([^\]]+)\]$/, (_, v) => `ml-[${v}]`],
  [/^\[margin-inline:([^\]]+)\]$/, (_, v) => `mx-[${v}]`],
  [/^\[margin-block:([^\]]+)\]$/, (_, v) => `my-[${v}]`],

  // gap → gap-[value]
  [/^\[gap:([^\]]+)\]$/, (_, v) => `gap-[${v}]`],
  [/^\[row-gap:([^\]]+)\]$/, (_, v) => `gap-y-[${v}]`],
  [/^\[column-gap:([^\]]+)\]$/, (_, v) => `gap-x-[${v}]`],

  // border-radius → rounded-[value]
  [/^\[border-radius:([^\]]+)\]$/, (_, v) => `rounded-[${v}]`],

  // border shorthand → border + border-[color]
  [/^\[border:1px_solid_([^\]]+)\]$/, (_, v) => `border border-[${v}]`],
  [/^\[border:(\d+(?:\.\d+)?px)_(solid|dashed|dotted|double)(?:_([^\]]+))?\]$/, (_, width, style, color) => {
    const classes = [width === '1px' ? 'border' : `border-[length:${width}]`, `border-${style}`];
    if (color) classes.push(`border-[${color}]`);
    return classes.join(' ');
  }],
  [/^\[border:([^\]]+)\]$/, (_, v) => `border-[${v}]`],
  // border-color → border-[value]
  [/^\[border-color:([^\]]+)\]$/, (_, v) => `border-[${v}]`],
  [/^\[border-width:([^\]]+)\]$/, (_, v) => `border-[length:${v}]`],
  [/^\[border-right-color:([^\]]+)\]$/, (_, v) => `border-r-[${v}]`],
  [/^\[border-top-color:([^\]]+)\]$/, (_, v) => `border-t-[${v}]`],
  // border-bottom
  [/^\[border-bottom:1px_solid_([^\]]+)\]$/, (_, v) => `border-b border-b-[${v}]`],
  [/^\[border-top:1px_solid_([^\]]+)\]$/, (_, v) => `border-t border-t-[${v}]`],
  [/^\[border-left:1px_solid_([^\]]+)\]$/, (_, v) => `border-l border-l-[${v}]`],
  [/^\[border-right:1px_solid_([^\]]+)\]$/, (_, v) => `border-r border-r-[${v}]`],
  [/^\[border-bottom:0\]$/, 'border-b-0'],
  [/^\[border-top:0\]$/, 'border-t-0'],
  [/^\[border-left:0\]$/, 'border-l-0'],
  [/^\[border-right:0\]$/, 'border-r-0'],
  [/^\[border-(bottom|top|left|right):(\d+(?:\.\d+)?px)_(solid|dashed|dotted|double)_([^\]]+)\]$/, (_, side, width, style, color) => `border-${side[0]}-[length:${width}] border-${style} border-${side[0]}-[${color}]`],

  // box-shadow → shadow-[value]
  [/^\[box-shadow:([^\]]+)\]$/, (_, v) => `shadow-[${v}]`],

  // opacity → opacity-[value]
  [/^\[opacity:([^\]]+)\]$/, (_, v) => `opacity-[${v}]`],

  // z-index
  [/^\[z-index:(\d+)\]$/, (_, v) => `z-[${v}]`],

  // top/right/bottom/left
  [/^\[top:([^\]]+)\]$/, (_, v) => `top-[${v}]`],
  [/^\[right:([^\]]+)\]$/, (_, v) => `right-[${v}]`],
  [/^\[bottom:([^\]]+)\]$/, (_, v) => `bottom-[${v}]`],
  [/^\[left:([^\]]+)\]$/, (_, v) => `left-[${v}]`],
  [/^\[inset:([^\]]+)\]$/, (_, v) => `inset-[${v}]`],

  // transform → [transform:value] (keep as-is, complex)
  // transition → [transition:value] (keep as-is, complex)

  // grid-template-columns
  [/^\[grid-template-columns:([^\]]+)\]$/, (_, v) => `grid-cols-[${v}]`],
  // grid-template-rows
  [/^\[grid-template-rows:([^\]]+)\]$/, (_, v) => `grid-rows-[${v}]`],
  // grid-auto-rows
  [/^\[grid-auto-rows:([^\]]+)\]$/, (_, v) => `auto-rows-[${v}]`],
  // grid-column
  [/^\[grid-column:span_2\]$/, 'col-span-2'],
  [/^\[grid-column:span_3\]$/, 'col-span-3'],
  [/^\[grid-column:([^\]]+)\]$/, (_, v) => `col-[${v}]`],
  [/^\[grid-row:([^\]]+)\]$/, (_, v) => `row-[${v}]`],
  [/^\[grid-auto-flow:([^\]]+)\]$/, (_, v) => `grid-flow-[${v}]`],

  // aspect-ratio
  [/^\[aspect-ratio:([^\]]+)\]$/, (_, v) => `aspect-[${v}]`],

  // font-family → font-[value]
  [/^\[font-family:([^\]]+)\]$/, (_, v) => `font-[${v}]`],
  // font (shorthand)
  [/^\[font:([^\]]+)\]$/, (_, v) => `[font:${v}]`],

  // scroll-margin-top
  [/^\[scroll-margin-top:([^\]]+)\]$/, (_, v) => `scroll-mt-[${v}]`],

  // backdrop-filter
  [/^\[backdrop-filter:blur\(([^)]+)\)\]$/, (_, v) => `backdrop-blur-[${v}]`],
  [/^\[backdrop-filter:([^\]]+)\]$/, (_, v) => `backdrop-[${v}]`],

  // filter
  [/^\[filter:([^\]]+)\]$/, (_, v) => `filter-[${v}]`],

  // accent-color
  [/^\[accent-color:([^\]]+)\]$/, (_, v) => `accent-[${v}]`],

  // object-position
  [/^\[object-position:([^\]]+)\]$/, (_, v) => `object-[${v}]`],

  // text-overflow
  [/^\[text-overflow:ellipsis\]$/, 'text-ellipsis'],

  [/^\[fill:([^\]]+)\]$/, (_, v) => `fill-[${v}]`],
  [/^\[stroke:([^\]]+)\]$/, (_, v) => `stroke-[${v}]`],
  [/^\[stroke-width:([^\]]+)\]$/, (_, v) => `stroke-[length:${v}]`],
  [/^\[content:([^\]]+)\]$/, (_, v) => `content-[${v}]`],
  [/^\[transform:none\]$/, 'transform-none'],
  [/^\[transform:([^\]]+)\]$/, (_, v) => `transform-[${v}]`],
  [/^\[transform-origin:([^\]]+)\]$/, (_, v) => `origin-[${v}]`],
  [/^\[outline-offset:([^\]]+)\]$/, (_, v) => `outline-offset-[${v}]`],
  [/^\[outline:(\d+(?:\.\d+)?px)_(solid|dashed|dotted|double)_([^\]]+)\]$/, (_, width, style, color) => `outline-[length:${width}] outline-${style} outline-[color:${color}]`],
  [/^\[animation:([^\]]+)\]$/, (_, v) => `animate-[${v}]`],
  [/^\[transition:([^\]]+)\]$/, (_, v) => convertTransition(v)],
  [/^\[transition-delay:([^\]]+)\]$/, (_, v) => `delay-[${v}]`],
  [/^\[inset-block-start:([^\]]+)\]$/, (_, v) => `top-[${v}]`],
  [/^\[inset-inline:([^\]]+)\]$/, (_, v) => `inset-x-[${v}]`],
  [/^\[inset-top:([^\]]+)\]$/, (_, v) => `top-[${v}]`],
  [/^\[z-index:([^\]]+)\]$/, (_, v) => `z-[${v}]`],

  // scroll-behavior
  [/^\[scroll-behavior:smooth\]$/, 'scroll-smooth'],
  [/^\[scroll-behavior:auto\]$/, 'scroll-auto'],
];

/**
 * Convert a single CSS arbitrary token like `[display:flex]` to Tailwind.
 * If no rule matches, return the token unchanged.
 */
function convertToken(token) {
  for (const [pattern, replacement] of RULES) {
    if (typeof replacement === 'string') {
      if (pattern.test(token)) return replacement;
    } else {
      const match = token.match(pattern);
      if (match) return replacement(...match);
    }
  }
  return token; // keep as-is if no rule matches
}

/**
 * Process a className string, converting [prop:value] tokens.
 * Handles prefixed tokens like `hover:[display:flex]`, `max-[700px]:[color:#fff]`, etc.
 */
function processClassName(classStr) {
  // Split on spaces but be careful with complex tokens
  const tokens = classStr.split(/\s+/);
  const result = [];
  
  for (const token of tokens) {
    if (!token) continue;

    // Check if token has a prefix (modifier) like hover:, max-[700px]:, [&_svg]:, etc.
    // Pattern: everything up to the last :[prop:value] that starts with [
    const prefixMatch = token.match(/^(.+?:)(\[[a-zA-Z-]+:[^\]]+\])$/);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      const cssToken = prefixMatch[2];
      const converted = convertToken(cssToken);
      // If conversion returns multiple classes (e.g. "border border-[#xxx]"),
      // we need to prefix each one
      if (converted.includes(' ')) {
        result.push(...converted.split(' ').map(c => `${prefix}${c}`));
      } else {
        result.push(`${prefix}${converted}`);
      }
    } else if (token.startsWith('[') && token.includes(':') && token.endsWith(']') && !token.startsWith('[&')) {
      // Direct CSS token without prefix, not an arbitrary selector
      const converted = convertToken(token);
      result.push(converted);
    } else {
      // Regular class or complex selector, keep as-is
      result.push(token);
    }
  }

  return result.join(' ');
}

/**
 * Process a file: find all className={`...`} and className="..." patterns,
 * convert CSS tokens inside them.
 */
function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changeCount = 0;

  // Match className={`...`} (template literals)
  content = content.replace(/className=\{`([^`]*)`\}/g, (match, classes) => {
    const converted = processClassName(classes);
    if (converted !== classes) changeCount++;
    return `className={\`${converted}\`}`;
  });

  // Match className="..." (regular strings)
  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    const converted = processClassName(classes);
    if (converted !== classes) changeCount++;
    return `className="${converted}"`;
  });

  // Match className='...' (single-quoted strings)
  content = content.replace(/className='([^']*)'/g, (match, classes) => {
    const converted = processClassName(classes);
    if (converted !== classes) changeCount++;
    return `className='${converted}'`;
  });

  // Catch class tokens inside concatenated templates, ternaries and important
  // variants that the className-level expressions above cannot parse as a
  // single static string. The negative lookbehind avoids reprocessing type
  // hints in utilities such as bg-[image:...] and border-[length:...].
  content = content.replace(/((?:[^\s'`{}]+:)*!?)(?<!-)(\[[a-zA-Z-]+:[^\]\s'`]+\])/g, (match, prefix, cssToken) => {
    const converted = convertToken(cssToken);
    if (converted === cssToken) return match;
    changeCount++;
    return converted
      .split(' ')
      .map((utility) => `${prefix}${utility}`)
      .join(' ');
  });

  content = content.replace(/((?:[^\s\x22\x27\x60{}]+:)*!?)border-\[(\d+(?:\.\d+)?px)_(solid|dashed|dotted|double)(?:_([^\]]+))?\]/g, (match, prefix, width, style, color) => {
    const classes = [width === '1px' ? 'border' : `border-[length:${width}]`, `border-${style}`];
    if (color) classes.push(`border-[${color}]`);
    changeCount++;
    return classes.map((utility) => `${prefix}${utility}`).join(' ');
  });

  return { content, changeCount };
}

// ──── Files to process ────
const FILES = [
  // Batch 1: Common & Auth
  'src/components/common/BrandLogo.tsx',
  'src/components/auth/LoginForm.tsx',
  'src/components/auth/RegisterForm.tsx',
  'src/components/auth/ForgotPasswordForm.tsx',
  'src/components/auth/ResetPasswordForm.tsx',
  'src/components/auth/OtpModal.tsx',
  // Batch 2: Dashboard shell
  'src/components/dashboard/DashboardHeader.tsx',
  'src/components/dashboard/SystemLauncher.tsx',
  // Batch 3: Dashboard home
  'src/components/dashboard/home/WelcomeHeroSection.tsx',
  'src/components/dashboard/home/ContentSections.tsx',
  'src/components/dashboard/home/CriteriaSections.tsx',
  'src/components/dashboard/home/CriterionDetailsDialog.tsx',
  'src/components/dashboard/home/DashboardDiscoverySections.tsx',
  'src/components/dashboard/home/DashboardFeedback.tsx',
  // Batch 4: Profile, Landing, Admin
  'src/components/profile/UserProfileForm.tsx',
  'src/components/landing/ProcessJourney.tsx',
  'src/components/landing/FeedbackSection.tsx',
  'src/components/admin/AdminLayout.tsx',
  // Batch 5: Views
  'src/views/HomeView.tsx',
  'src/views/UserProfileView.tsx',
  'src/views/NewsDetailView.tsx',
  'src/views/AuthPage.tsx',
  'src/views/AdminFeatureView.tsx',
  // Batch 6: Largest
  'src/views/AdminDashboardView.tsx',
  'src/views/LandingPage.tsx',
];

console.log('🔄 Starting CSS → Tailwind conversion...\n');
let totalChanges = 0;

for (const file of FILES) {
  const fullPath = resolve(root, file);
  try {
    const { content, changeCount } = processFile(fullPath);
    if (changeCount > 0) {
      writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${file} — ${changeCount} className(s) converted`);
      totalChanges += changeCount;
    } else {
      console.log(`⏭️  ${file} — no changes needed`);
    }
  } catch (err) {
    console.error(`❌ ${file} — ${err.message}`);
  }
}

console.log(`\n✨ Done! ${totalChanges} total className blocks converted across ${FILES.length} files.`);
