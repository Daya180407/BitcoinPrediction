import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

const DepositModal = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState('demo');
  const [loading, setLoading] = useState(false);
  const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

  const handleDeposit = async () => {
    if (amount < 1) return toast.error('Minimum deposit is $1');
    setLoading(true);
    try {
      if (method === 'demo') {
        const { data } = await paymentAPI.demoDeposit(amount);
        toast.success(data.message);
        onSuccess(data.walletBalance);
      } else {
        // Stripe/Razorpay flow would go here
        toast('In production, real payment gateway opens here', { icon: 'ℹ️' });
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full">
        <h2 className="font-display font-bold text-xl text-white mb-5">Deposit Funds</h2>

        {/* Method */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { id: 'demo', label: 'Demo', desc: 'Testing' },
            { id: 'stripe', label: 'Stripe', desc: 'Card' },
            { id: 'razorpay', label: 'Razorpay', desc: 'UPI/Card' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                method === m.id ? 'border-accent bg-accent/10 text-white' : 'border-border text-gray-400 hover:border-gray-500'
              }`}
            >
              <p className="font-bold text-sm">{m.label}</p>
              <p className="text-xs text-gray-500">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Quick amounts */}
        <p className="text-gray-400 text-sm mb-2">Quick Select</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`py-2 rounded-xl text-sm font-bold transition-all ${
                amount === a ? 'bg-accent text-white' : 'bg-surface border border-border text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              ${a}
            </button>
          ))}
        </div>

        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-accent"
            min={1}
          />
        </div>

        {method === 'demo' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
            <p className="text-blue-400 text-sm">Demo mode: Funds added instantly for testing</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-gray-400 hover:text-white transition-all">Cancel</button>
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-light transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Deposit $${amount}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const WithdrawModal = ({ balance, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [details, setDetails] = useState({ accountName: '', accountNumber: '', bankName: '' });
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 10) return toast.error('Minimum withdrawal is $10');
    if (parseFloat(amount) > balance) return toast.error('Insufficient balance');

    setLoading(true);
    try {
      const { data } = await walletAPI.requestWithdraw({
        amount: parseFloat(amount),
        method,
        accountDetails: details
      });
      toast.success('Withdrawal request submitted!');
      onSuccess(data.walletBalance);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full">
        <h2 className="font-display font-bold text-xl text-white mb-5">Withdraw Funds</h2>

        <div className="bg-surface rounded-xl p-3 mb-5 flex items-center justify-between border border-border">
          <span className="text-gray-400 text-sm">Available Balance</span>
          <span className="font-mono font-bold text-white">${balance?.toFixed(2)}</span>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Min $10"
              className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Method</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="crypto">Crypto Wallet</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        {method === 'bank_transfer' && (
          <div className="space-y-3 mb-4">
            <input placeholder="Account Name" value={details.accountName} onChange={e => setDetails({...details, accountName: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
            <input placeholder="Account Number" value={details.accountNumber} onChange={e => setDetails({...details, accountNumber: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
            <input placeholder="Bank Name" value={details.bankName} onChange={e => setDetails({...details, bankName: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent" />
          </div>
        )}
        {method === 'crypto' && (
          <input placeholder="Crypto Wallet Address" value={details.cryptoAddress || ''} onChange={e => setDetails({...details, cryptoAddress: e.target.value})}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent mb-4" />
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-gray-400 hover:text-white transition-all">Cancel</button>
          <button onClick={handleWithdraw} disabled={loading} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-400 transition-all disabled:opacity-50">
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function WalletPage() {
  const { wallet, updateWalletBalance } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab, setTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, wdRes] = await Promise.all([
        walletAPI.getTransactions(),
        walletAPI.getWithdrawals()
      ]);
      setTransactions(txRes.data.transactions);
      setWithdrawals(wdRes.data.requests);
    } catch {}
    setLoading(false);
  };

  const txIcons = {
    deposit: <ArrowDownLeft size={16} className="text-accent" />,
    withdrawal: <ArrowUpRight size={16} className="text-red-400" />,
    bet: <DollarSign size={16} className="text-yellow-400" />,
    win: <ArrowDownLeft size={16} className="text-accent" />,
    bonus: <Plus size={16} className="text-blue-400" />,
    referral: <Plus size={16} className="text-purple-400" />
  };

  const txColors = {
    deposit: 'text-accent', win: 'text-accent', bonus: 'text-blue-400', referral: 'text-purple-400',
    withdrawal: 'text-red-400', bet: 'text-red-400'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Balance header */}
      <div className="glass-card rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
        <p className="text-gray-400 mb-2">Total Balance</p>
        <p className="font-display font-black text-5xl text-white mb-1">${wallet.balance?.toFixed(2)}</p>
        <p className="text-gray-500 text-sm">Available for play</p>

        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={() => setShowDeposit(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-light transition-all"
          >
            <Plus size={18} /> Deposit
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white border border-red-500 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <ArrowUpRight size={18} /> Withdraw
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-5 border border-border">
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'withdrawals', label: 'Withdrawal Requests' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : tab === 'transactions' ? (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Wallet size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : transactions.map(tx => (
            <div key={tx._id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center border border-border">
                  {txIcons[tx.type]}
                </div>
                <div>
                  <p className="text-white font-medium text-sm capitalize">{tx.type}</p>
                  <p className="text-gray-500 text-xs">{tx.description}</p>
                  <p className="text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-bold ${txColors[tx.type] || 'text-white'}`}>
                  {['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
                <p className="text-gray-500 text-xs font-mono">${tx.balanceAfter.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <ArrowUpRight size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No withdrawal requests</p>
            </div>
          ) : withdrawals.map(wr => (
            <div key={wr._id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  wr.status === 'approved' ? 'bg-accent/20' : wr.status === 'rejected' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                }`}>
                  {wr.status === 'approved' ? <CheckCircle size={18} className="text-accent" /> :
                   wr.status === 'rejected' ? <XCircle size={18} className="text-red-400" /> :
                   <Clock size={18} className="text-yellow-400" />}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">${wr.amount} via {wr.method.replace('_', ' ')}</p>
                  <p className="text-gray-500 text-xs">{new Date(wr.createdAt).toLocaleString()}</p>
                  {wr.adminNote && <p className="text-gray-400 text-xs italic">{wr.adminNote}</p>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                wr.status === 'approved' ? 'bg-accent/20 text-accent' :
                wr.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {wr.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onSuccess={(bal) => { updateWalletBalance(bal); fetchData(); }}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          balance={wallet.balance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={(bal) => { updateWalletBalance(bal); fetchData(); }}
        />
      )}
    </div>
  );
}
