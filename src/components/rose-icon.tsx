type RoseIconProps = {
  className?: string
}

export function RoseIcon({ className }: RoseIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <path id="rose-petal" d="M32 32C18 30 15 14 32 5C49 14 46 30 32 32Z" />
      </defs>
      <g
        className="fill-rose-fill stroke-rose-ink"
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <g>
          <use xlinkHref="#rose-petal" />
          <use xlinkHref="#rose-petal" transform="rotate(72 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(144 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(216 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(288 32 32)" />
        </g>
        <g transform="rotate(36 32 32) translate(32 32) scale(.74) translate(-32 -32)">
          <use xlinkHref="#rose-petal" />
          <use xlinkHref="#rose-petal" transform="rotate(72 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(144 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(216 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(288 32 32)" />
        </g>
        <g transform="translate(32 32) scale(.48) translate(-32 -32)">
          <use xlinkHref="#rose-petal" />
          <use xlinkHref="#rose-petal" transform="rotate(72 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(144 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(216 32 32)" />
          <use xlinkHref="#rose-petal" transform="rotate(288 32 32)" />
        </g>
      </g>
    </svg>
  )
}
