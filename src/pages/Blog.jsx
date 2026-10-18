import { useState } from 'react';
import { articles } from '../data/content';
import { IMAGES } from '../data/images';
import PageHero from '../components/ui/PageHero';
import Reveal from '../components/ui/Reveal';
import TiltCard from '../components/ui/TiltCard';

export default function Blog() {
  const [tag, setTag] = useState('All');
  const tags = ['All', ...new Set(articles.map((a) => a.tag))];
  const list = tag === 'All' ? articles : articles.filter((a) => a.tag === tag);

  return (
    <>
      <PageHero eyebrow="Guides" title="Real estate guides and insights" text="Practical advice for buyers, sellers and renters." />
      <section className="section">
        <div className="container">
          <div className="chip-row" style={{ marginBottom: 28 }}>
            {tags.map((t) => <button key={t} className={`chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>)}
          </div>
          <div className="grid grid-3">
            {list.map((a, i) => (
              <Reveal key={a.id} delay={(i % 3) * 0.08}>
                <TiltCard className="pcard">
                  <div className="pcard-media"><img src={IMAGES[i % IMAGES.length]} alt="" loading="lazy" /></div>
                  <div className="pcard-body">
                    <span className="badge" style={{ alignSelf: 'start' }}>{a.tag}</span>
                    <h3 style={{ marginTop: 8 }}>{a.title}</h3>
                    <p className="muted">{a.excerpt}</p>
                    <small className="muted">{a.read} read</small>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
