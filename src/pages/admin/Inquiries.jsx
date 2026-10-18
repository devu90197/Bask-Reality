import { useStore } from '../../context/StoreContext';

const STATUSES = ['new', 'contacted', 'closed'];

export default function Inquiries() {
  const { inquiries, updateInquiry, deleteInquiry } = useStore();

  return (
    <>
      <div className="admin-top"><h2 style={{ margin: 0 }}>Inquiries ({inquiries.length})</h2></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Name</th><th>Contact</th><th>Type</th><th>Details</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {inquiries.map((q) => (
              <tr key={q.id}>
                <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                <td><b>{q.name}</b></td>
                <td>{q.email}<div className="muted" style={{ fontSize: '.82rem' }}>{q.phone}</div></td>
                <td><span className="badge">{q.type}</span></td>
                <td style={{ maxWidth: 320 }}>
                  {q.subject && <b>{q.subject}</b>}
                  {q.address && <div>{q.address} · {q.timeline}</div>}
                  <div className="muted" style={{ fontSize: '.85rem' }}>{q.message}</div>
                </td>
                <td>
                  <select className="select" value={q.status} onChange={(e) => updateInquiry(q.id, { status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteInquiry(q.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!inquiries.length && <div className="empty">No inquiries yet.</div>}
      </div>
    </>
  );
}
