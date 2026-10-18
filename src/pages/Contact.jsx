import PageHero from '../components/ui/PageHero';
import InquiryForm from '../components/ui/InquiryForm';

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help" text="Questions about buying, selling or renting? Send us a message." />
      <section className="section">
        <div className="container grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <InquiryForm type="contact" submitLabel="Send message" />
          </div>
          <div className="grid">
            <div className="card"><h3>📞 Call us</h3><p className="muted" style={{ margin: 0 }}>(800) 555-0199 · Mon–Sat, 8am–8pm</p></div>
            <div className="card"><h3>✉️ Email</h3><p className="muted" style={{ margin: 0 }}>hello@baskreality.com</p></div>
            <div className="card"><h3>📍 Office</h3><p className="muted" style={{ margin: 0 }}>500 Market Street, Suite 200, Seattle, WA</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
