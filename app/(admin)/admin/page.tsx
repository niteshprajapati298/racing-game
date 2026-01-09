'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ADMIN_EMAIL } from '@/lib/constants';

interface User {
  id: string;
  name: string;
  email: string;
  bestScore: number;
  rewardEligible: boolean;
  createdAt: string;
  scoreCount: number;
  totalScore: number;
}

interface Stats {
  totalUsers: number;
  totalScores: number;
  rewardEligibleUsers: number;
  averageBestScore: number;
  topScore: number;
  topScoreUser: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch users
      const usersResponse = await fetch(`/api/admin/users?page=${page}&limit=20&sortBy=bestScore&order=desc`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
        setTotalPages(usersData.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    }
  }, [page]);

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        if (data.user.email !== ADMIN_EMAIL) {
          setError('Access denied. Admin only.');
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        fetchData();
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [router, fetchData]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [page, isAuthenticated, fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold neon-cyan">Admin Panel</h1>
            <Button onClick={() => router.push('/')} variant="secondary">
              Home
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card glow>
              <div className="text-cyan-400 text-sm font-medium mb-2">Total Users</div>
              <div className="text-3xl font-bold neon-cyan">{stats.totalUsers}</div>
            </Card>
            <Card glow>
              <div className="text-cyan-400 text-sm font-medium mb-2">Total Scores</div>
              <div className="text-3xl font-bold neon-cyan">{stats.totalScores}</div>
            </Card>
            <Card glow>
              <div className="text-cyan-400 text-sm font-medium mb-2">Reward Eligible</div>
              <div className="text-3xl font-bold text-purple-400">{stats.rewardEligibleUsers}</div>
            </Card>
            <Card glow>
              <div className="text-cyan-400 text-sm font-medium mb-2">Average Best Score</div>
              <div className="text-3xl font-bold neon-cyan">{stats.averageBestScore.toLocaleString()}</div>
            </Card>
            <Card glow>
              <div className="text-cyan-400 text-sm font-medium mb-2">Top Score</div>
              <div className="text-3xl font-bold neon-cyan">{stats.topScore.toLocaleString()}</div>
              <div className="text-sm text-gray-400 mt-1">by {stats.topScoreUser}</div>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card className="overflow-x-auto">
          <h2 className="text-2xl font-bold neon-cyan mb-4">User Scores</h2>
          
          {users.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No users found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/30">
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Best Score</th>
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Total Scores</th>
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Total Points</th>
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Reward Eligible</th>
                      <th className="text-left py-3 px-4 text-cyan-400 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-cyan-300 font-medium">{user.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-white">{user.email}</td>
                        <td className="py-3 px-4 text-cyan-300 font-semibold">
                          {user.bestScore.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.scoreCount}</td>
                        <td className="py-3 px-4 text-gray-300">
                          {user.totalScore.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {user.rewardEligible ? (
                            <span className="text-purple-400 font-semibold">✓ Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <span className="text-cyan-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

