export function VineMargins() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden min-[1120px]:block">
      <div className="vine-column left-0">
        <div className="vine-track" />
      </div>
      <div className="vine-column right-0 -scale-x-100">
        <div className="vine-track [animation-delay:-50s]" />
      </div>
    </div>
  )
}
