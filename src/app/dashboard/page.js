"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Search, Edit2, Trash2, Send, LogOut } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [aliases, setAliases] = useState([]);
  const [stats, setStats] = useState({ total_aliases: 0, active_aliases: 0 });
  const [search, setSearch] = useState("");
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState(null);

  // Form states
  const [aliasForm, setAliasForm] = useState({ alias: "", destination_email: "" });
  const [composeForm, setComposeForm] = useState({ fromAlias: "", to: "", subject: "", body: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getHeaders = () => ({
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  });

  const fetchData = async () => {
    try {
      const [aliasesRes, statsRes] = await Promise.all([
        fetch("/api/aliases", { headers: getHeaders() }),
        fetch("/api/stats", { headers: getHeaders() })
      ]);

      if (aliasesRes.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const aliasesData = await aliasesRes.json();
      const statsData = await statsRes.json();

      if (Array.isArray(aliasesData)) {
        setAliases(aliasesData);
      } else {
        toast.error("Failed to load aliases (Admins only)");
      }
      if (!statsData.error) setStats(statsData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAlias = async (e) => {
    e.preventDefault();
    const url = editingAlias ? `/api/aliases/${editingAlias.id}` : "/api/aliases";
    const method = editingAlias ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(aliasForm)
    });

    if (res.ok) {
      toast.success(editingAlias ? "Alias updated" : "Alias created");
      setIsAliasModalOpen(false);
      setEditingAlias(null);
      setAliasForm({ alias: "", destination_email: "" });
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save alias");
    }
  };

  const handleDeleteAlias = async (id) => {
    if (!confirm("Are you sure you want to delete this alias?")) return;

    const res = await fetch(`/api/aliases/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    if (res.ok) {
      toast.success("Alias deleted");
      fetchData();
    } else {
      toast.error("Failed to delete alias");
    }
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Sending email...");
    const res = await fetch("/api/send", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(composeForm)
    });

    if (res.ok) {
      toast.success("Email sent!", { id: toastId });
      setIsComposeModalOpen(false);
      setComposeForm({ fromAlias: "", to: "", subject: "", body: "" });
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to send email", { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const filteredAliases = aliases.filter(a =>
    a.alias.toLowerCase().includes(search.toLowerCase()) ||
    a.destination_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 glass flex flex-col justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold mb-8 tracking-wider text-center text-blue-400">ALIAS.HUB</h1>
          <nav className="space-y-2">
            <button className="w-full flex items-center p-3 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              Dashboard
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center text-gray-400 hover:text-white p-3">
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="glass p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Overview</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsComposeModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
            >
              <Send className="w-4 h-4 mr-2" /> Compose
            </button>
            <button
              onClick={() => {
                setEditingAlias(null);
                setAliasForm({ alias: "", destination_email: "" });
                setIsAliasModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Alias
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-xl border-t-4 border-blue-500">
              <h3 className="text-gray-400 text-sm">Total Aliases</h3>
              <p className="text-4xl font-bold mt-2">{stats.total_aliases}</p>
            </div>
            <div className="glass p-6 rounded-xl border-t-4 border-green-500">
              <h3 className="text-gray-400 text-sm">Active Aliases</h3>
              <p className="text-4xl font-bold mt-2">{stats.active_aliases}</p>
            </div>
          </div>

          {/* Aliases Table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Your Aliases</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search aliases..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/50 text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Alias</th>
                    <th className="px-6 py-4 font-medium">Destination</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredAliases.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No aliases found.</td>
                    </tr>
                  ) : (
                    filteredAliases.map(a => (
                      <tr key={a.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4 font-medium text-blue-400">{a.alias}@<span className="text-gray-500">akay.codes</span></td>
                        <td className="px-6 py-4">{a.destination_email}</td>
                        <td className="px-6 py-4 text-gray-400">{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingAlias(a);
                              setAliasForm({ alias: a.alias, destination_email: a.destination_email });
                              setIsAliasModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlias(a.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Alias Modal */}
      {isAliasModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="glass p-6 rounded-xl w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4">{editingAlias ? "Edit Alias" : "Add Alias"}</h3>
            <form onSubmit={handleSaveAlias} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Alias Name</label>
                <div className="flex">
                  <input
                    type="text"
                    required
                    value={aliasForm.alias}
                    onChange={(e) => setAliasForm({...aliasForm, alias: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '')})}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-l-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="contact"
                  />
                  <span className="bg-gray-800 border border-l-0 border-gray-700 px-4 py-2 rounded-r-lg text-gray-400 flex items-center">
                    @akay.codes
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Destination Email</label>
                <input
                  type="email"
                  required
                  value={aliasForm.destination_email}
                  onChange={(e) => setAliasForm({...aliasForm, destination_email: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="your@gmail.com"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsAliasModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="glass p-6 rounded-xl w-full max-w-2xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center"><Send className="w-5 h-5 mr-2"/> Compose Mail</h3>
            <form onSubmit={handleSendMail} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">From Alias</label>
                <select
                  required
                  value={composeForm.fromAlias}
                  onChange={(e) => setComposeForm({...composeForm, fromAlias: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Select alias...</option>
                  {aliases.map(a => (
                    <option key={a.id} value={`${a.alias}@akay.codes`}>{a.alias}@akay.codes</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">To</label>
                <input
                  type="email"
                  required
                  value={composeForm.to}
                  onChange={(e) => setComposeForm({...composeForm, to: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({...composeForm, subject: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Hello there!"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Body</label>
                <textarea
                  required
                  rows="6"
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({...composeForm, body: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Type your message here..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsComposeModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center">
                  <Send className="w-4 h-4 mr-2" /> Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
