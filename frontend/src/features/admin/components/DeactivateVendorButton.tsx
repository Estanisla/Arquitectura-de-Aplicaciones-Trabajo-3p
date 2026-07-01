import { useState } from 'react'
import { deactivateVendor } from '../api/deactivateVendor'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type DeactivateVendorButtonProps = {
  vendorId: string
  displayName: string
  onDeactivated: () => void
}

export function DeactivateVendorButton({
  vendorId,
  displayName,
  onDeactivated,
}: DeactivateVendorButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const handleClick = async () => {
    const confirmed = window.confirm(
      `Desactivar la tienda "${displayName}"? Esta accion puede revertirse.`,
    )

    if (!confirmed) return

    setStatus('loading')
    setFeedback('')

    try {
      const result = await deactivateVendor(vendorId)

      if (!result.ok) {
        setStatus('error')
        setFeedback(DEFAULT_ERROR_MESSAGE)
        return
      }

      onDeactivated()
    } catch {
      setStatus('error')
      setFeedback(DEFAULT_ERROR_MESSAGE)
    }
  }

  return (
    <div>
      <button
        className="button-link button-link--danger"
        onClick={handleClick}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Desactivando...' : 'Desactivar tienda'}
      </button>
      {feedback && <p className="feedback feedback--error">{feedback}</p>}
    </div>
  )
}
