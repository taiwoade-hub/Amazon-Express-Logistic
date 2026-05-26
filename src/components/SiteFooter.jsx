import { COMPANY_PROFILE } from '../lib/companyProfile'

function SiteFooter() {
  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-lg font-black tracking-tight text-primary">{COMPANY_PROFILE.domain}</p>
        <p className="text-sm text-text-muted font-semibold mt-2">Courier services · Package delivery · Shipment tracking</p>

        <div className="mt-6 grid gap-2">
          <a href={COMPANY_PROFILE.phoneHref} className="block text-base font-black text-primary hover:text-black transition-colors">
            {COMPANY_PROFILE.phoneDisplay}
          </a>
          <a
            href={COMPANY_PROFILE.addressHref}
            target="_blank"
            rel="noreferrer"
            className="block text-sm text-text-muted font-semibold hover:text-primary transition-colors leading-relaxed"
          >
            {COMPANY_PROFILE.addressDisplay}
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-[11px] text-text-muted font-semibold">
          <p>&copy; 2026 All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
