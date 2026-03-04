import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Users, Activity, DollarSign, ArrowUpRight,
  Settings, CheckCircle, XCircle, Shield, Home,
  TrendingUp, BarChart2, Clock, LogOut
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'text-accent', sub }) => (
  <div className="bg-[#0d1f30] border border-[#1a3448] rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-gray-500 text-sm">{label}</span>
      <Icon size={18} className={color} />
    </div>
    <p className={`font-display font-black text-2xl ${color}`}>{value}</p>
    {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
  </div>
);

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bets, setBets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/');
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'bets') fetchBets();
    else if (tab === 'withdrawals') fetchWithdrawals();
    else if (tab === 'config') fetchConfig();
  }, [tab]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.stats);
    } catch {}
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(data.users);
    } catch {}
    setLoading(false);
  };

  const fetchBets = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getBets();
      setBets(data.bets);
    } catch {}
    setLoading(false);
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getWithdrawals('pending');
      setWithdrawals(data.requests);
    } catch {}
    setLoading(false);
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getConfig();
      setConfig(data.config);
    } catch {}
    setLoading(false);
  };

  const handleToggleUser = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      toast.success(data.message);
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleWithdrawal = async (id, action) => {
    try {
      await adminAPI.processWithdrawal(id, { action });
      toast.success(`Withdrawal ${action}d`);
      fetchWithdrawals();
    } catch { toast.error('Failed'); }
  };

  const handleConfigSave = async () => {
    try {
      await adminAPI.updateConfig(config);
      toast.success('Config saved!');
    } catch { toast.error('Failed to save'); }
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'bets', label: 'All Bets', icon: Activity },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
    { id: 'config', label: 'Config', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#051520] flex">
      {/* Sidebar */}
      <div className="w-60 bg-[#0A2A43] border-r border-[#1a3448] flex flex-col">
        <div className="p-5 border-b border-[#1a3448]">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-yellow-400" />
            <span className="font-display font-bold text-white">Admin Panel</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">{user?.email}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-accent/10 text-accent border border-accent/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1a3448] space-y-1">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <Home size={16} /> Back to Arena
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Dashboard */}
          {tab === 'dashboard' && (
            <div>
              <h1 className="font-display font-black text-2xl text-white mb-6">Dashboard Overview</h1>
              {stats && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
                    <StatCard icon={Activity} label="Total Bets" value={stats.totalBets} color="text-blue-400" />
                    <StatCard icon={DollarSign} label="Total Wagered" value={`$${stats.totalWagered?.toFixed(2)}`} color="text-yellow-400" />
                    <StatCard icon={TrendingUp} label="House Revenue" value={`$${stats.houseRevenue?.toFixed(2)}`} color="text-accent" />
                    <StatCard icon={DollarSign} label="Total Balance" value={`$${stats.totalBalance?.toFixed(2)}`} color="text-purple-400" sub="User wallets" />
                    <StatCard icon={ArrowUpRight} label="Pending Withdrawals" value={stats.pendingWithdrawals} color="text-red-400" />
                    <StatCard icon={CheckCircle} label="Wins" value={stats.wins} color="text-accent" />
                    <StatCard icon={XCircle} label="Losses" value={stats.losses} color="text-red-400" />
                  </div>

                  <div className="bg-[#0d1f30] border border-[#1a3448] rounded-xl p-5">
                    <h2 className="font-display font-bold text-white mb-4">Recent Bets</h2>
                    <div className="space-y-2">
                      {stats.recentBets?.map ? stats.recentBets.map(bet => (
                        <div key={bet._id} className="flex items-center justify-between py-2 border-b border-[#1a3448] last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-white">{bet.userId?.username || 'Unknown'}</span>
                            <span className="text-gray-500 text-xs">{bet.coinSymbol}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${bet.direction === 'UP' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'}`}>{bet.direction}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-white">${bet.betAmount}</span>
                            <span className={`text-xs font-bold ${bet.result === 'WIN' ? 'text-accent' : bet.result === 'LOSS' ? 'text-red-400' : 'text-yellow-400'}`}>{bet.result || 'ACTIVE'}</span>
                          </div>
                        </div>
                      )) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <h1 className="font-display font-black text-2xl text-white mb-6">User Management</h1>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u._id} className="bg-[#0d1f30] border border-[#1a3448] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{u.username}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                      <p className="text-gray-500 text-xs">Balance: ${u.wallet?.balance?.toFixed(2) || '0.00'} • Bets: {u.stats?.totalBets || 0}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${u.isActive ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Banned'}
                      </span>
                      <button
                        onClick={() => handleToggleUser(u._id)}
                        className="px-3 py-1.5 rounded-lg border border-[#1a3448] text-gray-400 hover:text-white hover:border-gray-500 text-xs transition-all"
                      >
                        {u.isActive ? 'Ban' : 'Unban'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bets */}
          {tab === 'bets' && (
            <div>
              <h1 className="font-display font-black text-2xl text-white mb-6">All Bets</h1>
              <div className="space-y-2">
                {bets.map(bet => (
                  <div key={bet._id} className="bg-[#0d1f30] border border-[#1a3448] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">{bet.userId?.username || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-500 text-xs">{bet.coinSymbol}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${bet.direction === 'UP' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'}`}>{bet.direction}</span>
                          <span className="text-gray-500 text-xs">{bet.duration}s</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-mono font-bold text-white">${bet.betAmount}</p>
                        <p className="text-gray-500 text-xs">{new Date(bet.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        bet.result === 'WIN' ? 'bg-accent/20 text-accent' :
                        bet.result === 'LOSS' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{bet.result || 'ACTIVE'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawals */}
          {tab === 'withdrawals' && (
            <div>
              <h1 className="font-display font-black text-2xl text-white mb-6">Withdrawal Requests</h1>
              <div className="space-y-3">
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No pending withdrawals</div>
                ) : withdrawals.map(wr => (
                  <div key={wr._id} className="bg-[#0d1f30] border border-[#1a3448] rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-white">{wr.userId?.username} ({wr.userId?.email})</p>
                        <p className="text-gray-400 text-sm mt-0.5">Amount: <span className="text-white font-bold">${wr.amount}</span> via {wr.method}</p>
                        <p className="text-gray-500 text-xs">{new Date(wr.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">Pending</span>
                    </div>
                    {wr.accountDetails && (
                      <div className="bg-black/20 rounded-lg p-3 mb-3 text-xs text-gray-400 space-y-1">
                        {Object.entries(wr.accountDetails).filter(([,v]) => v).map(([k, v]) => (
                          <div key={k}><span className="text-gray-500">{k}:</span> {v}</div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWithdrawal(wr._id, 'approve')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 text-sm font-medium transition-all"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleWithdrawal(wr._id, 'reject')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-sm font-medium transition-all"
                      >
                        <XCircle size={14} /> Reject & Refund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config */}
          {tab === 'config' && config && (
            <div>
              <h1 className="font-display font-black text-2xl text-white mb-6">Game Configuration</h1>
              <div className="bg-[#0d1f30] border border-[#1a3448] rounded-xl p-6 max-w-lg">
                <div className="space-y-4">
                  {[
                    { key: 'payoutMultiplier', label: 'Payout Multiplier', type: 'number', step: 0.1 },
                    { key: 'minBetAmount', label: 'Min Bet ($)', type: 'number' },
                    { key: 'maxBetAmount', label: 'Max Bet ($)', type: 'number' },
                    { key: 'minWithdrawalAmount', label: 'Min Withdrawal ($)', type: 'number' },
                    { key: 'maxWithdrawalAmount', label: 'Max Withdrawal ($)', type: 'number' },
                    { key: 'dailyLoginBonus', label: 'Daily Login Bonus ($)', type: 'number' },
                    { key: 'referralBonus', label: 'Referral Bonus ($)', type: 'number' }
                  ].map(({ key, label, type, step }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                      <input
                        type={type}
                        step={step || 1}
                        value={config[key] || ''}
                        onChange={e => setConfig({ ...config, [key]: parseFloat(e.target.value) })}
                        className="w-full bg-surface border border-[#1a3448] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm text-gray-400">Maintenance Mode</label>
                    <button
                      onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                      className={`w-12 h-6 rounded-full transition-all ${config.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-all mx-0.5 ${config.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <button
                    onClick={handleConfigSave}
                    className="w-full py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-light transition-all mt-2"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
