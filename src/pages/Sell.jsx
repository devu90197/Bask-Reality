import PageHero from '../components/ui/PageHero';
import Reveal from '../components/ui/Reveal';
import TiltCard from '../components/ui/TiltCard';
import InquiryForm from '../components/ui/InquiryForm';
import Select from '../components/ui/Select';

const steps = [
  { n: '01', title: 'Free home valuation', text: 'Your agent prepares a pricing analysis based on recent local sales.' },
  { n: '02', title: 'Prep and photography', text: 'Professional photos, 3D walkthroughs and staging advice.' },
  { n: '03', title: 'Market everywhere', text: 'Your listing reaches buyers online, through social media and across our network.' },
  { n: '04', title: 'Negotiate and close', text: 'We handle offers, inspections and paperwork through closing.' },
];

export default function Sell() {
  return (
    <>
      <PageHero eyebrow="Sell with BASK" title="Sell your home for top dollar" text="Expert pricing, premium marketing and a dedicated agent at a low listing fee." />
      <section className="section">
        <div className="container grid grid-2" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">How it works</span>
            <h2>A simple, four-step process</h2>
            <div className="grid" style={{ marginTop: 24 }}>
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08}>
                  <TiltCard className="card" intensity={6}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <b style={{ fontSize: '1.6rem', color: 'var(--brand)' }}>{s.n}</b>
                      <div><h3>{s.title}</h3><p className="muted" style={{ margin: 0 }}>{s.text}</p></div>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal className="card">
            <h2 style={{ fontSize: '1.6rem' }}>Get your free estimate</h2>
            <InquiryForm
              type="valuation"
              submitLabel="Get my estimate"
              extraFields={
                <div className="form-grid">
                  <div className="field"><label htmlFor="s-addr">Property address</label><input id="s-addr" name="address" className="input" required /></div>
                  <div className="field">
                    <label htmlFor="s-time">When are you selling?</label>
                    <Select id="s-time" name="timeline" options={['ASAP', '1–3 months', '3–6 months', 'Just curious']} />
                  </div>
                </div>
              }
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
