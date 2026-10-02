import { useState } from 'react'
import { User } from 'lucide-react'

export function AvatarPanel() {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary sm:size-28">
      {failed ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <User className="size-7" />
          <span className="text-[9px]">/avatar.jpg</span>
        </div>
      ) : (
        <img
          src="/avatar.jpeg"
          alt="Gabriel Rosa"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
