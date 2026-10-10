import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Edit2, Trash2, Key, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { api, AdminUser, Doctor } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const UsersManager: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetCredsModalOpen, setResetCredsModalOpen] = useState(false);

  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);

  // Create form (Split First Name and Last Name)
  const [createForm, setCreateForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'receptionist' as AdminUser['role'],
    doctorId: '',
  });

  // Edit form (Split First Name and Last Name)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'receptionist' as AdminUser['role'],
    isActive: true,
    doctorId: '',
  });

  // Reset Credentials form (Requirements #7: Admin can change username and password for staff)
  const [credsForm, setCredsForm] = useState({
    username: '',
    newPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([api.getUsers(), api.getDentists(true)])
      .then(([userData, docData]) => {
        setUsers(userData);
        setDoctors(docData);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (u: AdminUser) => {
    setActiveUser(u);
    let parsedFirst = u.firstName || '';
    let parsedLast = u.lastName || '';
    if (!parsedFirst && !parsedLast && u.fullName) {
      const parts = u.fullName.trim().split(' ');
      parsedFirst = parts[0] || '';
      parsedLast = parts.slice(1).join(' ') || '';
    }

    setEditForm({
      firstName: parsedFirst,
      lastName: parsedLast,
      email: u.email || '',
      role: u.role,
      isActive: u.isActive,
      doctorId: u.doctorId || '',
    });
    setEditModalOpen(true);
  };

  const handleOpenResetCreds = (u: AdminUser) => {
    setActiveUser(u);
    setCredsForm({
      username: u.username,
      newPassword: '',
    });
    setResetCredsModalOpen(true);
  };

  const handleDelete = async (id: string, username: string) => {
    if (!window.confirm(`Delete staff account for '${username}'?`)) return;
    try {
      await api.deleteUser(id);
      success(`User '${username}' removed.`);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Could not delete user.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username || !createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.password) {
      error('Please complete required fields (Username, First Name, Last Name, Password).');
      return;
    }

    const resolvedFullName = `${createForm.firstName.trim()} ${createForm.lastName.trim()}`;

    setIsSubmitting(true);
    try {
      await api.createUser({
        ...createForm,
        fullName: resolvedFullName,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
      });
      success(`Staff account for '${createForm.username}' created!`);
      setCreateModalOpen(false);
      setCreateForm({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'receptionist',
        doctorId: '',
      });
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      error('First Name and Last Name are required.');
      return;
    }

    const resolvedFullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`;

    setIsSubmitting(true);
    try {
      await api.updateUser(activeUser.id, {
        ...editForm,
        fullName: resolvedFullName,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      success(`Account updated for '${activeUser.username}'`);
      setEditModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to update account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    setIsSubmitting(true);
    try {
      await api.updateUserCredentials(activeUser.id, credsForm);
      success(`Credentials reset for user '${activeUser.username}'!`);
      setResetCredsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to reset credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin (Full Access)',
    doctor_manager: 'Doctor Manager (Clinicians & Schedule)',
    receptionist: 'Receptionist (Appointments & Walk-ins)',
    doctor: 'Doctor (Personal Calendar & Dental Tips)',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Staff Accounts & Role-Based Access Control
          </h2>
          <p className="text-xs text-slate-500">
            Create and manage clinic staff, assign granular roles, deactivate accounts, or reset staff passwords.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Staff User</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role & Access</th>
                  <th className="py-3.5 px-4">Linked Clinician</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => {
                  const linkedDoc = doctors.find((d) => d.id === u.doctorId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                        {u.email && <div className="text-[10px] text-slate-400">{u.email}</div>}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] bg-sky-50 text-sky-800 border border-sky-200">
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {linkedDoc ? linkedDoc.name : '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Super Admin can change username and password for staff! */}
                          <button
                            onClick={() => handleOpenResetCreds(u)}
                            className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-1"
                            title="Change staff username or password"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Reset Credentials</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                          >
                            Edit
                          </button>

                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= CREATE STAFF MODAL ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Create New Staff Account
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dawit_rec"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              {/* First Name & Last Name Split */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dawit"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tadesse"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@vioradental.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned RBAC Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="receptionist">Receptionist (Appointments & Walk-ins)</option>
                  <option value="doctor_manager">Doctor Manager (Doctors & Clinic Content)</option>
                  <option value="doctor">Doctor (Personal Schedule & Dental Tips)</option>
                  <option value="super_admin">Super Admin (Full Administrative Authority)</option>
                </select>
              </div>

              {createForm.role === 'doctor' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link to Clinician Profile
                  </label>
                  <select
                    value={createForm.doctorId}
                    onChange={(e) => setCreateForm({ ...createForm, doctorId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT USER MODAL ================= */}
      {editModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Edit User: {activeUser.username}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor_manager">Doctor Manager</option>
                    <option value="doctor">Doctor</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600"
                    />
                    <span>Account Active</span>
                  </label>
                </div>
              </div>

              {editForm.role === 'doctor' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link to Clinician Profile
                  </label>
                  <select
                    value={editForm.doctorId}
                    onChange={(e) => setEditForm({ ...editForm, doctorId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Not linked (sees no appointments)</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RESET CREDENTIALS MODAL (SUPER ADMIN ONLY) ================= */}
      {resetCredsModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Reset Staff Credentials
                </h3>
                <p className="text-xs text-slate-500">
                  Direct administrative override for {activeUser.fullName}
                </p>
              </div>
              <button
                onClick={() => setResetCredsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCredsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Username
                </label>
                <input
                  type="text"
                  required
                  value={credsForm.username}
                  onChange={(e) => setCredsForm({ ...credsForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Set New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters (leave empty if keeping current)"
                  value={credsForm.newPassword}
                  onChange={(e) => setCredsForm({ ...credsForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetCredsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Apply New Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
