import { useEffect, useState } from "react";
import { Search, Plus, X, DollarSign, Users, TrendingUp } from "lucide-react";
import axios from "axios";

import { useToast } from "@/hooks/use-toast";

export default function AdminInfluencers() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");

  const [newContact, setNewContact] = useState("");
  const { toast } = useToast();
  //Function to add text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Your referral link has been copied.",
      variant: "success",
    });
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/influencers`, {
        params: { q, page, limit: 50 },
      });
      setList(res.data.data.items);
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to load influencers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [q, page]);

  const openPay = (infl) => {
    setSelected(infl);
    setPayAmount("");
    setNote("");
  };

  const doPay = async () => {
    if (!selected) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      alert("Invalid amount");
      return;
    }
    try {
      const res = await axios.post(
        `/api/admin/influencers/${selected._id}/pay`,
        {
          amount,
          paymentMethod: "manual",
          note,
        }
      );
      setList(list.map((i) => (i._id === selected._id ? res.data.data : i)));
      alert("Payment confirmed!");
      setSelected(null);
    } catch (err) {
      alert(err?.response?.data?.error || "Payment failed");
    }
  };

  const createNew = async (e) => {
    e.preventDefault();
    if (!newName || !newContact) {
      alert("Please fill all fields");
      return;
    }
    try {
      await axios.post("/api/admin/create-influencer", {
        name: newName,
        contact: newContact,
      });
      setList([
        ...list,
        {
          _id: String(Math.random()),
          name: newName,
          contact: newContact,
          referralCount: 0,
          totalEarning: 0,
          pendingPayment: 0,
        },
      ]);
      setNewName("");
      setNewContact("");
      setShowCreateForm(false);
      alert("Influencer created!");
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create");
    }
  };

  const filteredList = list.filter(
    (i) =>
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      i.contact.toLowerCase().includes(q.toLowerCase())
  );

  const totalEarnings = list.reduce((sum, i) => sum + i.totalEarning, 0);
  const totalPending = list.reduce((sum, i) => sum + i.pendingPayment, 0);
  const totalReferrals = list.reduce((sum, i) => sum + i.referralCount, 0);

  return (
    <div className="min-h-screen bg-[#020202] relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[128px] pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 lg:p-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-white mb-2">
            Influencer{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              Management
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Manage and track your influencer partnerships
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  Total Amount Paid
                </p>
                <p className="text-4xl font-bold text-white">
                  ₹{totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  Pending Payouts
                </p>
                <p className="text-4xl font-bold text-orange-400">
                  ₹{totalPending.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">
                  Total Referrals
                </p>
                <p className="text-4xl font-bold text-blue-400">
                  {totalReferrals}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or contact..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="group relative h-12 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-red-700 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all border border-white/10 overflow-hidden flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 skew-x-12 -ml-4 w-1/2 h-full blur-md" />
            <Plus className="w-5 h-5 relative" />
            <span className="relative">Add Influencer</span>
          </button>
        </div>

        {/* Table */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Referrals
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Referral Link
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Total Paid
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Pending
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No influencers found
                    </td>
                  </tr>
                ) : null}
                {filteredList.map((i, idx) => (
                  <tr
                    key={i._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{i.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
                        {i.referralCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `http://localhost:8080/signup?ref=${i.referalLink}`
                            )
                          }
                          className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium"
                        >
                          http://localhost:8080/signup?ref={i.referalLink}
                        </button>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {i.contact}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-green-400">
                        ₹{i.totalEarning.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium">
                        ₹{i.pendingPayment.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openPay(i)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/80 to-red-600/80 hover:from-orange-600 hover:to-red-700 text-white font-medium text-sm transition-all hover:scale-105"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
            <div className="w-full max-w-md mx-4">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Add New Influencer
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Name
                    </label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter influencer name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Email or Phone
                    </label>
                    <input
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNew}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold hover:from-green-700 hover:to-emerald-800 transition-all"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {selected && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
            <div className="w-full max-w-md mx-4">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Pay {selected.name}
                  </h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <p className="text-sm text-gray-400 mb-1">Pending Amount</p>
                    <p className="text-3xl font-bold text-orange-400">
                      ₹{selected.pendingPayment.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Amount to Pay (₹)
                    </label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Payment reference, notes..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={doPay}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold hover:from-green-700 hover:to-emerald-800 transition-all"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
