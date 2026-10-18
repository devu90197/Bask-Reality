import PageHero from '../components/ui/PageHero';

const COPY = {
  privacy: {
    title: 'Privacy policy',
    body: [
      'We collect the information you provide when you create an account, save homes or contact an agent, and use it only to deliver our services.',
      'We never sell your personal information. You can request a copy of your data or ask us to delete it at any time by contacting hello@baskreality.com.',
    ],
  },
  terms: {
    title: 'Terms of use',
    body: [
      'Listing information is provided for personal, non-commercial use and is believed accurate but not guaranteed.',
      'Payment estimates are for illustration only and are not an offer to lend. Please verify all details with a licensed professional.',
    ],
  },
};

export default function Legal({ page }) {
  const c = COPY[page];
  return (
    <>
      <PageHero eyebrow="Legal" title={c.title} />
      <section className="section">
        <div className="container card" style={{ maxWidth: 820 }}>
          {c.body.map((t) => <p key={t}>{t}</p>)}
        </div>
      </section>
    </>
  );
}
