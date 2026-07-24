import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { Users, ShieldAlert, ShieldCheck } from 'lucide-react';
import Loader from '../../components/Loader';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnrestrict = async (userId) => {
    try {
      setUnblockingId(userId);
      const res = await api.put(`/auth/admin/users/${userId}/unrestrict`);
      toast.success(res.data.message);
      
      // Update local state
      setUsers(users.map(u => 
        u._id === userId 
          ? { ...u, isRestricted: false, fakeOrderCount: 0 }
          : u
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unrestrict user');
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return <Loader fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#d4af37]" />
          User Management
        </h2>
      </div>

      <div className="bg-[#12081a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold text-center">Fake/Cancelled Orders</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-white/40 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.fakeOrderCount >= 5 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : user.fakeOrderCount > 0
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-white/5 text-white/50 border border-white/10'
                    }`}>
                      {user.fakeOrderCount || 0}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {user.isRestricted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Restricted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {user.isRestricted && (
                      <button
                        onClick={() => handleUnrestrict(user._id)}
                        disabled={unblockingId === user._id}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {unblockingId === user._id ? 'Unblocking...' : 'Unblock User'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-white/40">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
