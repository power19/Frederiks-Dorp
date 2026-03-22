"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, User, Mail, Phone, Briefcase } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface EditState {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyEdit = (): EditState => ({ name: "", role: "", email: "", phone: "", notes: "" });

const inputCls =
  "border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500";

export function CustomerContacts({ customerId }: { customerId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [newContact, setNewContact] = useState<EditState>(emptyEdit());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditState>(emptyEdit());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchContacts = useCallback(async () => {
    const res = await fetch(`/api/customers/${customerId}/contacts`);
    if (res.ok) {
      const data = await res.json();
      setContacts(data);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  async function handleAdd() {
    if (!newContact.name.trim()) { setError("Name is required"); return; }
    setError("");
    setSaving(true);
    const res = await fetch(`/api/customers/${customerId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newContact.name,
        role: newContact.role || null,
        email: newContact.email || null,
        phone: newContact.phone || null,
        notes: newContact.notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setNewContact(emptyEdit());
      setAddingNew(false);
      fetchContacts();
    } else {
      setError("Failed to add contact");
    }
  }

  async function handleEdit(id: string) {
    if (!editValues.name.trim()) { setError("Name is required"); return; }
    setError("");
    setSaving(true);
    const res = await fetch(`/api/customers/${customerId}/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editValues.name,
        role: editValues.role || null,
        email: editValues.email || null,
        phone: editValues.phone || null,
        notes: editValues.notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      fetchContacts();
    } else {
      setError("Failed to save changes");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/customers/${customerId}/contacts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) fetchContacts();
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setEditValues({
      name: contact.name,
      role: contact.role ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      notes: contact.notes ?? "",
    });
    setError("");
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">
          Contacts ({contacts.length})
        </h3>
        {!addingNew && (
          <button
            onClick={() => { setAddingNew(true); setError(""); setEditingId(null); }}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={14} /> Add Contact
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs mb-3">{error}</p>
      )}

      {/* Add new contact form */}
      {addingNew && (
        <div className="border border-blue-200 rounded-lg p-4 mb-4 bg-blue-50 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">New Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input
                value={newContact.name}
                onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                className={inputCls}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Role / Title</label>
              <input
                value={newContact.role}
                onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))}
                className={inputCls}
                placeholder="e.g. IT Manager"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={newContact.email}
                onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                className={inputCls}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                value={newContact.phone}
                onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                className={inputCls}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <input
                value={newContact.notes}
                onChange={e => setNewContact(p => ({ ...p, notes: e.target.value }))}
                className={inputCls}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check size={13} /> {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setAddingNew(false); setNewContact(emptyEdit()); setError(""); }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contact list */}
      {loading ? (
        <p className="text-sm text-slate-400 py-2">Loading…</p>
      ) : contacts.length === 0 && !addingNew ? (
        <p className="text-sm text-slate-400 text-center py-6">
          No contacts yet — click <strong>Add Contact</strong> to add one
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <div key={contact.id} className="border border-slate-200 rounded-lg p-3">
              {editingId === contact.id ? (
                /* Inline edit form */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                      <input
                        value={editValues.name}
                        onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Role / Title</label>
                      <input
                        value={editValues.role}
                        onChange={e => setEditValues(p => ({ ...p, role: e.target.value }))}
                        className={inputCls}
                        placeholder="e.g. IT Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={editValues.email}
                        onChange={e => setEditValues(p => ({ ...p, email: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                      <input
                        value={editValues.phone}
                        onChange={e => setEditValues(p => ({ ...p, phone: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                      <input
                        value={editValues.notes}
                        onChange={e => setEditValues(p => ({ ...p, notes: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contact.id)}
                      disabled={saving}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Check size={12} /> {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setError(""); }}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-sm text-slate-900">{contact.name}</span>
                      </div>
                      {contact.role && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Briefcase size={10} />
                          {contact.role}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Mail size={11} /> {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          <Phone size={11} /> {contact.phone}
                        </a>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="text-xs text-slate-500 italic">{contact.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(contact)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit contact"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      disabled={deletingId === contact.id}
                      className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete contact"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
