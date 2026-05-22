import { COMPANY_PROFILE } from '../lib/companyProfile'

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-black text-primary tracking-tight">{COMPANY_PROFILE.name}</p>
            <p className="text-xs text-text-muted font-semibold">Courier services · Package delivery · Shipment tracking</p>
          </div>

          <div className="space-y-2 md:text-right">
            <a
              href={COMPANY_PROFILE.phoneHref}
              className="inline-flex items-center justify-start md:justify-end text-sm font-black text-primary hover:text-black transition-colors"
            >
              {COMPANY_PROFILE.phoneDisplay}
            </a>
            <a
              href={COMPANY_PROFILE.addressHref}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-text-muted font-semibold hover:text-primary transition-colors max-w-md md:max-w-sm md:ml-auto leading-relaxed"
            >
              {COMPANY_PROFILE.addressDisplay}
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center text-[11px] text-text-muted font-semibold">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
