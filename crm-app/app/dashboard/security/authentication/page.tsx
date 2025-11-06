'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MFASettings,
  SecurityRole,
  UserRoleAssignment,
  UserSession,
  FailedLoginAttempt,
  Profile
} from '@/types/database';
import { 
  Shield,
  Key,
  Users,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  MessageSquare,
  Fingerprint,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Monitor,
  User,
  UserCheck,
  UserX,
  Calendar,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Info,
  Bell,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

interface AuthenticationStats {
  totalUsers: number;
  mfaEnabledUsers: number;
  activeSessions: number;
  failedLoginsToday: number;
  suspiciousActivity: number;
  passwordExpiringSoon: number;
  lockedAccounts: number;
  mfaAdoptionRate: number;
}

interface UserWithMFA {
  user: Profile;
  mfaSettings: MFASettings | null;
  activeRoles: (UserRoleAssignment & { role: SecurityRole })[];
  activeSessions: UserSession[];
  lastLogin: string | null;
  failedAttempts: number;
  isLocked: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function AuthenticationManagementPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AuthenticationStats>({
    totalUsers: 0,
    mfaEnabledUsers: 0,
    activeSessions: 0,
    failedLoginsToday: 0,
    suspiciousActivity: 0,
    passwordExpiringSoon: 0,
    lockedAccounts: 0,
    mfaAdoptionRate: 0
  });
  const [users, setUsers] = useState<UserWithMFA[]>([]);
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<FailedLoginAttempt[]>([]);
  const [selectedTab, setSelectedTab] = useState<'users' | 'roles' | 'sessions' | 'failed-logins' | 'settings'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterMFA, setFilterMFA] = useState('all');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithMFA | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAuthenticationData();
    }
  }, [profile]);

  const fetchAuthenticationData = async () => {
    if (!profile?.organization_id) return;
    
    try {
      setLoading(true);
      setRefreshing(true);

      // Fetch all users in organization
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (profilesError) throw profilesError;

      // Fetch MFA settings for all users
      const { data: mfaSettings, error: mfaError } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (mfaError) throw mfaError;

      // Fetch user role assignments with roles
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          role:security_roles(*)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (roleError) throw roleError;

      // Fetch active sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (sessionsError) throw sessionsError;

      // Fetch failed login attempts (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: failedLogins, error: failedError } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .gte('last_attempt_at', yesterday.toISOString())
        .order('last_attempt_at', { ascending: false });

      if (failedError) throw failedError;

      // Fetch security roles
      const { data: securityRoles, error: rolesError } = await supabase
        .from('security_roles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Process and combine data
      const processedUsers = await processUserData(
        profiles || [], 
        mfaSettings || [], 
        roleAssignments || [],
        sessions || []
      );

      setUsers(processedUsers);
      setRoles(securityRoles || []);
      setFailedAttempts(failedLogins || []);
      
      // Calculate statistics
      const authStats = calculateAuthenticationStats(
        processedUsers,
        sessions || [],
        failedLogins || []
      );
      setStats(authStats);

    } catch (error) {
      console.error('Error fetching authentication data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processUserData = async (
    profiles: Profile[],
    mfaSettings: MFASettings[],
    roleAssignments: any[],
    sessions: UserSession[]
  ): Promise<UserWithMFA[]> => {
    return profiles.map(user => {
      const userMFA = mfaSettings.find(mfa => mfa.user_id === user.id);
      const userRoles = roleAssignments.filter(ra => ra.user_id === user.id);
      const userSessions = sessions.filter(s => s.user_id === user.id);
      
      // Calculate risk level based on various factors
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      // Factors that increase risk:
      // - No MFA enabled
      // - Multiple failed login attempts
      // - Multiple active sessions
      // - Admin roles without MFA
      
      const hasAdminRole = userRoles.some(role => role.role?.permissions?.admin);
      const hasMultipleSessions = userSessions.length > 3;
      const noMFA = !userMFA?.is_enabled;
      
      if (hasAdminRole && noMFA) riskLevel = 'critical';
      else if (noMFA && hasMultipleSessions) riskLevel = 'high';
      else if (noMFA) riskLevel = 'medium';

      return {
        user,
        mfaSettings: userMFA || null,
        activeRoles: userRoles,
        activeSessions: userSessions,
        lastLogin: userSessions[0]?.last_activity || null,
        failedAttempts: 0, // Will be calculated from failed_login_attempts
        isLocked: false, // Will be determined from failed attempts
        riskLevel
      };
    });
  };

  const calculateAuthenticationStats = (
    users: UserWithMFA[],
    sessions: UserSession[],
    failedLogins: FailedLoginAttempt[]
  ): AuthenticationStats => {
    const totalUsers = users.length;
    const mfaEnabledUsers = users.filter(u => u.mfaSettings?.is_enabled).length;
    const mfaAdoptionRate = totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0;
    
    return {
      totalUsers,
      mfaEnabledUsers,
      activeSessions: sessions.length,
      failedLoginsToday: failedLogins.length,
      suspiciousActivity: users.filter(u => u.riskLevel === 'high' || u.riskLevel === 'critical').length,
      passwordExpiringSoon: 0, // Placeholder - would need password policy implementation
      lockedAccounts: users.filter(u => u.isLocked).length,
      mfaAdoptionRate
    };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
                       user.activeRoles.some(role => role.role_id === filterRole);
    
    const matchesMFA = filterMFA === 'all' ||
                      (filterMFA === 'enabled' && user.mfaSettings?.is_enabled) ||
                      (filterMFA === 'disabled' && !user.mfaSettings?.is_enabled);
    
    return matchesSearch && matchesRole && matchesMFA;
  });

  const handleEnableMFA = async (userId: string) => {
    try {
      // Create MFA settings if they don't exist
      const { error } = await supabase
        .from('mfa_settings')
        .upsert({
          user_id: userId,
          organization_id: profile?.organization_id,
          is_enabled: true,
          sms_enabled: true,
          email_enabled: true
        });

      if (error) throw error;
      
      await fetchAuthenticationData();
    } catch (error) {
      console.error('Error enabling MFA:', error);
    }
  };

  const handleDisableMFA = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('mfa_settings')
        .update({ is_enabled: false })
        .eq('user_id', userId)
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;
      
      await fetchAuthenticationData();
    } catch (error) {
      console.error('Error disabling MFA:', error);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
      
      await fetchAuthenticationData();
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const handleUnlockAccount = async (userId: string) => {
    try {
      // Clear failed login attempts for this user
      const { error } = await supabase
        .from('failed_login_attempts')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchAuthenticationData();
    } catch (error) {
      console.error('Error unlocking account:', error);
    }
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Authentication & Access Control</h1>
          <p className="text-body text-neutral-700 mt-1">
            Manage user authentication, MFA settings, and access permissions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuthenticationData}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateRole(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        </div>
      </div>

      {/* Authentication Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Total Users</p>
              <p className="text-h3 font-bold text-neutral-900">{stats.totalUsers}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {stats.activeSessions} active sessions
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">MFA Adoption</p>
              <p className="text-h3 font-bold text-green-600">{stats.mfaAdoptionRate}%</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {stats.mfaEnabledUsers} of {stats.totalUsers} users
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Failed Logins</p>
              <p className="text-h3 font-bold text-red-600">{stats.failedLoginsToday}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                Last 24 hours
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">High Risk Users</p>
              <p className="text-h3 font-bold text-orange-600">{stats.suspiciousActivity}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                Require attention
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-6">
        <div className="border-b border-neutral-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', label: 'Users & MFA', icon: Users },
              { id: 'roles', label: 'Roles & Permissions', icon: Key },
              { id: 'sessions', label: 'Active Sessions', icon: Monitor },
              { id: 'failed-logins', label: 'Failed Logins', icon: XCircle },
              { id: 'settings', label: 'Auth Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Users & MFA Tab */}
        {selectedTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.role_name}</option>
                ))}
              </select>
              
              <select
                value={filterMFA}
                onChange={(e) => setFilterMFA(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="all">All MFA Status</option>
                <option value="enabled">MFA Enabled</option>
                <option value="disabled">MFA Disabled</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      MFA Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredUsers.map((userWithMFA) => (
                    <tr key={userWithMFA.user.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {userWithMFA.user.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900">
                              {userWithMFA.user.full_name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {userWithMFA.user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {userWithMFA.mfaSettings?.is_enabled ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Disabled
                            </span>
                          )}
                          <div className="flex gap-1">
                            {userWithMFA.mfaSettings?.sms_enabled && (
                              <MessageSquare className="w-3 h-3 text-blue-500" title="SMS enabled" />
                            )}
                            {userWithMFA.mfaSettings?.email_enabled && (
                              <Mail className="w-3 h-3 text-green-500" title="Email enabled" />
                            )}
                            {userWithMFA.mfaSettings?.biometric_enabled && (
                              <Fingerprint className="w-3 h-3 text-purple-500" title="Biometric enabled" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {userWithMFA.activeRoles.map((assignment) => (
                            <span
                              key={assignment.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {assignment.role?.role_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(userWithMFA.riskLevel)}`}>
                          {getRiskLevelIcon(userWithMFA.riskLevel)}
                          <span className="ml-1">{userWithMFA.riskLevel.toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {userWithMFA.lastLogin ? (
                          <div>
                            <div>{format(new Date(userWithMFA.lastLogin), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-neutral-400">
                              {formatDistanceToNow(new Date(userWithMFA.lastLogin), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {userWithMFA.mfaSettings?.is_enabled ? (
                            <button
                              onClick={() => handleDisableMFA(userWithMFA.user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Disable MFA"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnableMFA(userWithMFA.user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Enable MFA"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => setSelectedUser(userWithMFA)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {userWithMFA.isLocked && (
                            <button
                              onClick={() => handleUnlockAccount(userWithMFA.user.id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Unlock Account"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No users found</h3>
                <p className="text-neutral-600">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No users match the selected filters'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Security Roles Tab */}
        {selectedTab === 'roles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.id} className="border border-neutral-200 rounded-lg p-6 hover:border-primary-300 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">{role.role_name}</h3>
                      <p className="text-sm text-neutral-600 mt-1">{role.role_description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {role.is_system_role && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          System
                        </span>
                      )}
                      <button className="text-neutral-400 hover:text-neutral-600">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-neutral-700">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(role.permissions).map(([module, perms]: [string, any]) => (
                        <span key={module} className="px-2 py-1 rounded text-xs bg-neutral-100 text-neutral-700">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">
                        {users.filter(u => u.activeRoles.some(r => r.role_id === role.id)).length} users
                      </span>
                      <span className="text-neutral-500">
                        {format(new Date(role.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs content would go here... */}
        {selectedTab === 'sessions' && (
          <div className="text-center py-12">
            <Monitor className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Active Sessions Management</h3>
            <p className="text-neutral-600">Session management interface coming soon...</p>
          </div>
        )}

        {selectedTab === 'failed-logins' && (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed Login Analysis</h3>
            <p className="text-neutral-600">Failed login monitoring interface coming soon...</p>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Authentication Settings</h3>
            <p className="text-neutral-600">Authentication configuration interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}