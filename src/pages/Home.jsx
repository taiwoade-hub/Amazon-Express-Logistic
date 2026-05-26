import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, Globe, Mail, Plane, ShieldCheck, Truck } from 'lucide-react'

function Home() {
  const [trackingId, setTrackingId] = useState('')
  const navigate = useNavigate()

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    if (trackingId.trim()) {
      navigate(`/track?id=${trackingId.trim().toUpperCase()}`)
    }
  }

  return (
    <main className="bg-white min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/hero-section.jpg)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/25" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border border-white/20 text-[11px] text-primary font-black uppercase tracking-wider">
              <span>Fast. Reliable. Secure.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Delivering What
              <br />
              Matters Most
            </h1>

            <p className="text-sm sm:text-base text-white/85 font-semibold leading-relaxed max-w-xl">
              Fast, secure and affordable delivery services across the country. Track every step in real-time.
            </p>

            <form onSubmit={handleTrackSubmit} className="glass-panel rounded-3xl p-5 bg-white/95 max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-wider text-primary mb-3">Track Your Package</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter Tracking ID"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="flex-grow px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
                />
                <button type="submit" className="bg-primary hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm transition-colors">
                  Track Now
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/track"
                className="bg-primary hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm transition-colors inline-flex items-center gap-2"
              >
                <span>Track Package</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-white/95">
            <div className="flex items-center justify-between">
              <p className="font-black text-primary tracking-tight">Track Your Package</p>
              <span className="text-[11px] font-black uppercase tracking-wider bg-black text-white px-3 py-1 rounded-full">In Transit</span>
            </div>

            <div className="mt-6 space-y-5">
              {[
                { label: 'Processing', date: 'May 20, 2025 · 09:00 AM', active: true },
                { label: 'Picked Up', date: 'May 20, 2025 · 02:30 PM', active: true },
                { label: 'In Transit', date: 'May 21, 2025 · 08:15 AM', active: true },
                { label: 'Delivered', date: 'Pending', active: false }
              ].map((item, idx) => (
                <div key={item.label} className={`flex gap-4 ${item.active ? '' : 'opacity-40'}`}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                        item.active ? 'bg-primary text-white' : 'bg-white text-primary border border-border'
                      }`}
                    >
                      {item.active ? '✓' : idx + 1}
                    </div>
                    {idx < 3 && <div className={`w-px h-8 ${item.active ? 'bg-border-active' : 'bg-border'}`} />}
                  </div>
                  <div className="pt-1">
                    <p className="font-black text-primary">{item.label}</p>
                    <p className="text-xs text-text-muted font-semibold mt-0.5">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 bg-white flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <p className="font-black text-primary">Fast Delivery</p>
              <p className="text-sm text-text-muted font-semibold mt-1">Priority handling and reliable drop-offs for every shipment.</p>
            </div>
          </div>
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 bg-white flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <p className="font-black text-primary">Real-Time Tracking</p>
              <p className="text-sm text-text-muted font-semibold mt-1">Track your package in real-time with clear status updates.</p>
            </div>
          </div>
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 bg-white flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-black text-primary">Secure Shipping</p>
              <p className="text-sm text-text-muted font-semibold mt-1">Careful handling, verified checkpoints, and dependable delivery.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-primary">Our Logistics Services</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-primary mt-2">Built for speed, scale, and control</h2>
          </div>
          <p className="text-sm text-text-muted font-semibold max-w-2xl">
            From express drop-offs to international freight and end-to-end supply chain support, we keep your shipments moving with clear tracking and dependable service.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-8">
          <div className="glass-panel glass-panel-hover rounded-3xl bg-white overflow-hidden">
            <div className="aspect-[16/10]">
              <img src="/about-the-site.jpg" alt="Express delivery service" className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <p className="font-black text-primary text-lg">Express Delivery</p>
              </div>
              <p className="text-sm text-text-muted font-semibold mt-3 leading-relaxed">
                Same-day and next-day options designed for urgent shipments. We prioritize pickup, route optimization, and secure handoff so deliveries arrive right on time.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-primary/90 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Door-to-door pickup and drop-off</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Priority handling at every checkpoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Fast email updates for key milestones</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl bg-white overflow-hidden">
            <div className="aspect-[16/10]">
              <img src="/hero-section.jpg" alt="International air freight" className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                  <Plane size={18} />
                </div>
                <p className="font-black text-primary text-lg">International Freight</p>
              </div>
              <p className="text-sm text-text-muted font-semibold mt-3 leading-relaxed">
                Reliable air and sea freight options to move goods across borders. We coordinate documentation, tracking, and delivery to keep international shipping simple.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-primary/90 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Air and ocean freight coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Clear tracking from origin to destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Support for customs-ready paperwork</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl bg-white overflow-hidden">
            <div className="aspect-[16/10]">
              <img src="/cour.jpg" alt="Supply chain solutions" className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                  <Boxes size={18} />
                </div>
                <p className="font-black text-primary text-lg">Supply Chain Solutions</p>
              </div>
              <p className="text-sm text-text-muted font-semibold mt-3 leading-relaxed">
                Flexible logistics support for growing businesses—warehousing, distribution planning, and delivery workflows that reduce delays and keep operations smooth.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-primary/90 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Inventory flow and shipment coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Smart routing for cost and speed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Reliable last-mile delivery support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="glass-panel rounded-[32px] bg-white overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10">
              <p className="text-[11px] font-black uppercase tracking-wider text-primary">Ship With Confidence</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-primary mt-2">Every delivery handled like it matters</h2>
              <p className="text-sm text-text-muted font-semibold mt-3 leading-relaxed max-w-xl">
                We combine secure handling, clear tracking, and quick updates so you always know where your shipment is—and what happens next.
              </p>

              <div className="mt-6 grid gap-3 text-sm text-primary/90 font-semibold">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="font-black text-primary">Secure checkpoints</p>
                    <p className="text-text-muted font-semibold mt-1">Verified handling from pickup to final delivery.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-black text-primary">Fast email updates</p>
                    <p className="text-text-muted font-semibold mt-1">Get delivery milestone notifications without delays.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0">
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="font-black text-primary">Nationwide coverage</p>
                    <p className="text-text-muted font-semibold mt-1">Built to support local shipping and long-distance routes.</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/send"
                  className="bg-primary hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm transition-colors inline-flex items-center gap-2"
                >
                  <span>Send a Package</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/track"
                  className="bg-white hover:bg-black/5 text-primary px-6 py-3 rounded-2xl font-black text-sm transition-colors border border-border"
                >
                  Track Shipment
                </Link>
              </div>
            </div>

            <div className="min-h-[260px] lg:min-h-full">
              <img src="/amazonlogistics-container.jpg" alt="Logistics container" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
