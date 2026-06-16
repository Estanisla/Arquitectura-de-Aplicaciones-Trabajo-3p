import { useState } from 'react'
import { deactivateVendor } from '../api/deactivateVendor'

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
        setFeedback(result.message)
        return
      }

      onDeactivated()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado'
      setStatus('error')
      setFeedback(message)
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
