import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, ShieldCheck, Truck } from 'lucide-react'
import ShipmentForm from '../components/ShipmentForm'

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
    <main className="relative overflow-hidden bg-background min-h-screen">
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border text-[11px] text-primary font-black uppercase tracking-wider">
            <span>Fast. Reliable. Secure.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-primary leading-[1.05]">
            Delivering What
            <br />
            Matters Most
          </h1>

          <p className="text-sm sm:text-base text-text-muted font-semibold leading-relaxed max-w-xl">
            Fast, secure and affordable delivery services across the country. Track every step in real-time.
          </p>

          <form onSubmit={handleTrackSubmit} className="glass-panel rounded-3xl p-5 bg-white max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-wider text-primary mb-3">Track Your Package</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter Tracking ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-grow px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-border-active text-sm font-semibold"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm transition-colors"
              >
                Track Now
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3">
            <Link to="/send" className="bg-primary hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-sm transition-colors inline-flex items-center gap-2">
              <span>Send Package</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/track" className="bg-white hover:bg-black/5 text-primary px-6 py-3 rounded-2xl font-black text-sm transition-colors border border-border">
              Learn More
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 bg-white">
          <div className="flex items-center justify-between">
            <p className="font-black text-primary tracking-tight">Track Your Package</p>
            <span className="text-[11px] font-black uppercase tracking-wider bg-black text-white px-3 py-1 rounded-full">
              In Transit
            </span>
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
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${item.active ? 'bg-primary text-white' : 'bg-white text-primary border border-border'}`}>
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
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-3xl p-6 bg-white flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <p className="font-black text-primary">Fast Delivery</p>
              <p className="text-sm text-text-muted font-semibold mt-1">We ensure your packages reach on time, every time.</p>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-6 bg-white flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <p className="font-black text-primary">Real-Time Tracking</p>
              <p className="text-sm text-text-muted font-semibold mt-1">Track your package in real-time at every step.</p>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-6 bg-white flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-black text-primary">Secure Shipping</p>
              <p className="text-sm text-text-muted font-semibold mt-1">Your packages are safe with us, always.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 bg-white">
          <ShipmentForm title="Send a Package" description="Fill in the details below to create a new delivery." />
        </div>
      </section>

      <footer className="border-t border-border py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-text-muted text-xs font-semibold">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

export default Home
