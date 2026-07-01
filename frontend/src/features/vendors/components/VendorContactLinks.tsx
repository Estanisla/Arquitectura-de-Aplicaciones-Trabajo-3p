import type { StoreContact } from '../vendor.types'

type VendorContactLinksProps = {
  contacts: StoreContact[]
}

const labels: Record<StoreContact['channel'], string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  email: 'Correo',
  website: 'Sitio web',
}

const toSafeHref = (contact: StoreContact): string | null => {
  const value = contact.value.trim()
  if (!value) return null

  if (contact.channel === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? `mailto:${value}`
      : null
  }

  if (contact.channel === 'whatsapp') {
    const phone = value.replace(/\D/g, '')
    return phone.length >= 8 ? `https://wa.me/${phone}` : null
  }

  const candidate =
    /^https?:\/\//i.test(value)
      ? value
      : contact.channel === 'instagram'
        ? `https://instagram.com/${value.replace(/^@/, '')}`
        : contact.channel === 'facebook'
          ? `https://facebook.com/${value.replace(/^@/, '')}`
          : `https://${value}`

  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function VendorContactLinks({ contacts }: VendorContactLinksProps) {
  const links = contacts
    .map((contact) => ({ contact, href: toSafeHref(contact) }))
    .filter(
      (item): item is { contact: StoreContact; href: string } =>
        item.href !== null,
    )

  if (links.length === 0) {
    return null
  }

  return (
    <section className="store-contact-section" aria-labelledby="store-contact-title">
      <h2 id="store-contact-title">Contactar con la tienda</h2>
      <nav className="store-contact-links" aria-label="Canales de contacto">
        {links.map(({ contact, href }) => (
          <a
            className="button-link button-link--secondary"
            href={href}
            key={contact.channel}
            rel="noreferrer"
            target="_blank"
          >
            {labels[contact.channel]}
          </a>
        ))}
      </nav>
    </section>
  )
}
