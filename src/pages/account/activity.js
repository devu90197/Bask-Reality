import { formatPrice, statusInfo } from '../../utils/format';

export const ACTIVITY_TYPES = {
  view: { label: 'Viewed', icon: 'eye', tone: 'sky' },
  search: { label: 'Searched', icon: 'search', tone: 'indigo' },
  save: { label: 'Saved', icon: 'heart', tone: 'pink' },
  unsave: { label: 'Removed', icon: 'heart', tone: 'slate' },
  inquiry: { label: 'Inquiry', icon: 'inquiries', tone: 'amber' },
  calc: { label: 'Calculation', icon: 'calc', tone: 'green' },
};

const INQUIRY_KIND = { tour: 'tour request', valuation: 'valuation request', contact: 'message' };

// One plain-English line per history entry, plus where it links to.
export function describe(a, properties = []) {
  const d = a.data || {};
  const title = d.title || properties.find((p) => p.id === d.propertyId)?.title || 'a home';
  switch (a.type) {
    case 'view': return { text: `Viewed ${title}`, to: d.propertyId && `/property/${d.propertyId}` };
    case 'save': return { text: `Saved ${title}`, to: d.propertyId && `/property/${d.propertyId}` };
    case 'unsave': return { text: `Removed ${title} from saved homes`, to: d.propertyId && `/property/${d.propertyId}` };
    case 'search': {
      const where = statusInfo(d.status);
      const bits = [d.q && `“${d.q}”`, d.filters].filter(Boolean).join(' · ');
      return { text: `Searched ${where.label.toLowerCase()} homes${bits ? `: ${bits}` : ''}`, to: `${where.page}${d.q ? `?q=${encodeURIComponent(d.q)}` : ''}` };
    }
    case 'inquiry': return { text: `Sent a ${INQUIRY_KIND[d.type] || 'request'}${d.subject ? `: ${d.subject}` : ''}`, to: '/account/inquiries' };
    case 'calc': return { text: `Saved calculation “${d.name || 'Untitled'}”${d.monthly ? ` · ${formatPrice(d.monthly)}/mo` : ''}`, to: '/account/calculations' };
    default: return { text: a.type };
  }
}

// "Today", "Yesterday", or a date, for grouping the timeline.
export const dayLabel = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};

export const timeOf = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
