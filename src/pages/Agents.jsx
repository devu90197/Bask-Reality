import { useStore } from '../context/StoreContext';
import PageHero from '../components/ui/PageHero';
import Reveal from '../components/ui/Reveal';
import TiltCard from '../components/ui/TiltCard';

export default function Agents() {
  const { agents, properties, ready } = useStore();

  return (
    <>
      <PageHero eyebrow="Our team" title="Find a local agent" text="Experienced agents who know your neighborhood and put your interests first." />
      <section className="section">
        <div className="container">
          {agents.length ? (
            <div className="grid grid-3">
              {agents.map((a, i) => {
                const count = properties.filter((p) => p.agentId === a.id).length;
                return (
                  <Reveal key={a.id} delay={(i % 3) * 0.08}>
                    <TiltCard className="card agent-card">
                      {a.photo ? <img src={a.photo} alt={a.name} loading="lazy" /> : <div className="agent-initials">{a.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>}
                      <h3 style={{ marginBottom: 4 }}>{a.name}</h3>
                      {a.city && <p className="muted" style={{ marginBottom: 8 }}>{a.city}</p>}
                      <p>{count} active listing{count === 1 ? '' : 's'}</p>
                      <div className="chip-row" style={{ justifyContent: 'center' }}>
                        {a.phone && <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="btn btn-primary btn-sm">{a.phone}</a>}
                        {a.email && <a href={`mailto:${a.email}`} className="btn btn-ghost btn-sm">Email</a>}
                      </div>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="card empty">{ready ? 'Our agent team will be listed here soon.' : 'Loading…'}</div>
          )}
        </div>
      </section>
    </>
  );
}
