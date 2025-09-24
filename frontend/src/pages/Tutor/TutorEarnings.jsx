import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  CreditCard,
  Banknote,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const TutorEarnings = () => {
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    availableBalance: 0,
    pendingPayments: 0,
    withdrawn: 0,
    monthlyEarnings: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const navigate = useNavigate();

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch sessions to calculate earnings
      const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessions = sessionsResponse.data || [];

      // Calculate earnings data
      const completedSessions = sessions.filter(session => session.status === 'completed');
      const totalEarned = completedSessions.length * 25; // $25 per session
      const availableBalance = totalEarned * 0.8; // 80% available (20% platform fee)
      const pendingPayments = totalEarned * 0.1; // 10% pending
      const withdrawn = totalEarned * 0.1; // 10% already withdrawn

      // Generate monthly earnings data (mock data for demo)
      const monthlyEarnings = [
        { month: 'Jan', amount: 125 },
        { month: 'Feb', amount: 180 },
        { month: 'Mar', amount: 220 },
        { month: 'Apr', amount: 195 },
        { month: 'May', amount: 250 },
        { month: 'Jun', amount: 280 }
      ];

      // Generate recent transactions
      const recentTransactions = completedSessions.slice(0, 10).map((session, index) => ({
        id: session._id,
        type: 'session_payment',
        amount: 25,
        description: `Session with ${session.learners?.[0]?.name || 'Student'}`,
        date: session.completedAt || session.startTime,
        status: index < 8 ? 'completed' : 'pending'
      }));

      setEarnings({
        totalEarned,
        availableBalance,
        pendingPayments,
        withdrawn,
        monthlyEarnings,
        recentTransactions
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setError('Failed to load earnings data');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleWithdraw = () => {
    // Navigate to withdrawal page or show modal
    console.log('Initiate withdrawal');
  };

  const handleDownloadStatement = () => {
    // Generate and download earnings statement
    console.log('Download statement');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="mt-2 text-gray-600">Track your tutoring income and manage payments.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Earnings Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Earned</dt>
                    <dd className="text-lg font-medium text-gray-900">${earnings.totalEarned}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Banknote className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Available Balance</dt>
                    <dd className="text-lg font-medium text-gray-900">${earnings.availableBalance}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">${earnings.pendingPayments}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Withdrawn</dt>
                    <dd className="text-lg font-medium text-gray-900">${earnings.withdrawn}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Chart */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Monthly Earnings</h3>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="month">Last 6 Months</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between space-x-2">
                {earnings.monthlyEarnings.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(month.amount / 300) * 200}px` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2">{month.month}</div>
                    <div className="text-xs font-medium text-gray-900">${month.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Earnings Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Session Earnings (80%)</span>
                  <span className="text-sm font-medium text-gray-900">${earnings.availableBalance}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform Fee (20%)</span>
                  <span className="text-sm font-medium text-gray-900">${earnings.totalEarned * 0.2}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Available to Withdraw</span>
                    <span className="text-lg font-bold text-green-600">${earnings.availableBalance}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <button
              onClick={handleDownloadStatement}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Statement
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {earnings.recentTransactions.length > 0 ? (
              earnings.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">+${transaction.amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-500">Your earnings transactions will appear here once you complete sessions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Withdraw Funds</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">${earnings.availableBalance}</p>
                <p className="text-sm text-gray-500">Minimum withdrawal: $50</p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={earnings.availableBalance < 50}
                className={`px-6 py-3 rounded-lg font-medium ${
                  earnings.availableBalance >= 50
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Withdraw Funds
              </button>
            </div>

            {earnings.availableBalance < 50 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  You need at least $50 to make a withdrawal. Complete more sessions to reach the minimum amount.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorEarnings;