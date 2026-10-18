import { useStore } from '../../context/StoreContext';

export default function Users() {
  const { users, deleteUser } = useStore();

  return (
    <>
      <div className="admin-top"><h2 style={{ margin: 0 }}>Users ({users.length})</h2></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b></td>
                <td>{u.email}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => confirm(`Remove ${u.email}?`) && deleteUser(u.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <div className="empty">No registered users yet.</div>}
      </div>
    </>
  );
}
