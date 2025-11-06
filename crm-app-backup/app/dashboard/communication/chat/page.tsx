'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Headphones,
  Bot,
  User,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  Archive,
  Flag,
  Tag,
  Zap,
  TrendingUp,
  UserPlus
} from 'lucide-react';

interface ChatStats {
  activeSessions: number;
  waitingSessions: number;
  completedToday: number;
  avgResponseTime: number;
  avgSessionDuration: number;
  customerSatisfaction: number;
  totalAgentsOnline: number;
  botHandled: number;
}

interface ChatSession {
  id: string;
  customer_name: string;
  customer_id: string;
  agent_name: string;
  status: string;
  priority: string;
  tags: string[];
  started_at: string;
  ended_at: string;
  satisfaction_rating: number;
  satisfaction_feedback: string;
  last_message: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_type: 'customer' | 'employee' | 'bot';
  sender_name: string;
  message_content: string;
  timestamp: string;
  read_status: boolean;
  message_type: string;
}

export default function ChatSupportSystem() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (user?.organization_id) {
      fetchChatData();
    }
  }, [user?.organization_id]);

  const fetchChatData = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Fetch chat sessions with customer and employee data
      const { data: sessionsData } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          customer_id,
          employee_id,
          status,
          priority,
          tags,
          started_at,
          ended_at,
          satisfaction_rating,
          satisfaction_feedback,
          customers!inner(full_name),
          employees(first_name, last_name)
        `)
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(50);

      // Get current date for today's stats
      const today = new Date().toISOString().split('T')[0];

      // Calculate stats
      const activeSessions = sessionsData?.filter(s => s.status === 'active').length || 0;
      const waitingSessions = sessionsData?.filter(s => s.status === 'waiting').length || 0;
      const completedToday = sessionsData?.filter(s => 
        s.status === 'completed' && s.ended_at?.startsWith(today)
      ).length || 0;
      const botHandled = sessionsData?.filter(s => s.status === 'bot_handling').length || 0;

      // Calculate satisfaction average
      const ratedSessions = sessionsData?.filter(s => s.satisfaction_rating) || [];
      const avgSatisfaction = ratedSessions.length > 0 
        ? ratedSessions.reduce((sum, s) => sum + s.satisfaction_rating, 0) / ratedSessions.length 
        : 0;

      // Get unique agents
      const uniqueAgents = new Set(sessionsData?.filter(s => s.employee_id).map(s => s.employee_id));

      setStats({
        activeSessions,
        waitingSessions,
        completedToday,
        avgResponseTime: 45, // Would calculate from message timestamps
        avgSessionDuration: 18, // Would calculate from session start/end times
        customerSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        totalAgentsOnline: uniqueAgents.size,
        botHandled
      });

      // Process sessions data
      const processedSessions: ChatSession[] = sessionsData?.map(session => {
        const customer = session.customers as any;
        const employee = session.employees as any;
        
        return {
          id: session.id,
          customer_name: customer?.full_name || 'Unknown Customer',
          customer_id: session.customer_id,
          agent_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Bot',
          status: session.status,
          priority: session.priority || 'normal',
          tags: session.tags || [],
          started_at: session.started_at || '',
          ended_at: session.ended_at || '',
          satisfaction_rating: session.satisfaction_rating || 0,
          satisfaction_feedback: session.satisfaction_feedback || '',
          last_message: 'Loading...', // Would fetch latest message
          unread_count: 0 // Would calculate unread messages
        };
      }) || [];

      setSessions(processedSessions);

      // If a session is selected, fetch its messages
      if (selectedSession) {
        fetchSessionMessages(selectedSession);
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_type,
          sender_id,
          message_content,
          timestamp,
          read_status,
          message_type,
          metadata
        `)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      const processedMessages: ChatMessage[] = messagesData?.map(msg => ({
        id: msg.id,
        sender_type: msg.sender_type as 'customer' | 'employee' | 'bot',
        sender_name: msg.metadata?.agent_name || msg.sender_type === 'bot' ? 'TailorBot' : 'Customer',
        message_content: msg.message_content,
        timestamp: msg.timestamp || '',
        read_status: msg.read_status || false,
        message_type: msg.message_type || 'text'
      })) || [];

      setMessages(processedMessages);
    } catch (error) {
      console.error('Error fetching session messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: selectedSession,
            sender_type: 'employee',
            sender_id: user?.id,
            message_content: newMessage,
            message_type: 'text',
            timestamp: new Date().toISOString(),
            read_status: false,
            metadata: { agent_name: user?.full_name || 'Agent' }
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      fetchSessionMessages(selectedSession);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const assignToAgent = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          employee_id: user?.id,
          status: 'active' 
        })
        .eq('id', sessionId);

      if (error) throw error;
      fetchChatData();
    } catch (error) {
      console.error('Error assigning session:', error);
    }
  };

  const closeSession = async (sessionId: string, rating?: number) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString(),
          satisfaction_rating: rating || null
        })
        .eq('id', sessionId);

      if (error) throw error;
      setSelectedSession(null);
      fetchChatData();
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50';
      case 'waiting': return 'text-amber-600 bg-amber-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'bot_handling': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredSessions = sessions.filter(session => {
    const statusMatch = statusFilter === 'all' || session.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || session.priority === priorityFilter;
    const searchMatch = searchTerm === '' || 
      session.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.agent_name.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && priorityMatch && searchMatch;
  });

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat support system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chat Support System</h1>
                <p className="text-gray-600">Manage customer chat sessions and live support</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchChatData()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Chats</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.activeSessions}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" />
                  Currently active
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Waiting Queue</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.waitingSessions}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Need assistance
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.completedToday}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Successfully resolved
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Satisfaction</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.customerSatisfaction}/5</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3" />
                  Average rating
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chat Sessions List */}
          <div className="lg:col-span-4">
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Chat Sessions</h2>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="waiting">Waiting</option>
                    <option value="completed">Completed</option>
                    <option value="bot_handling">Bot Handling</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers or agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setSelectedSession(session.id);
                      fetchSessionMessages(session.id);
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedSession === session.id
                        ? 'bg-purple-50 border-2 border-purple-200'
                        : 'bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{session.customer_name}</p>
                        <p className="text-sm text-gray-600">{session.agent_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        {session.priority !== 'normal' && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(session.priority)}`}>
                            {session.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{formatTimeAgo(session.started_at)}</p>
                      {session.status === 'waiting' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            assignToAgent(session.id);
                          }}
                          className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
                        >
                          Take Chat
                        </button>
                      )}
                    </div>
                    {session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-8">
            {selectedSession ? (
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {sessions.find(s => s.id === selectedSession)?.customer_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sessions.find(s => s.id === selectedSession)?.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => closeSession(selectedSession)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'employee' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender_type === 'employee'
                            ? 'bg-purple-600 text-white'
                            : message.sender_type === 'bot'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message_content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_type === 'employee' ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          {formatTimeAgo(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat Session</h3>
                  <p className="text-gray-600">Choose a customer conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-medium text-purple-600">{stats?.avgResponseTime}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Session Duration</span>
                <span className="text-sm font-medium text-blue-600">{stats?.avgSessionDuration}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Agents Online</span>
                <span className="text-sm font-medium text-emerald-600">{stats?.totalAgentsOnline}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bot Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bot Handled</span>
                <span className="text-sm font-medium text-blue-600">{stats?.botHandled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-emerald-600">85%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Escalations</span>
                <span className="text-sm font-medium text-amber-600">15%</span>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-900">Invite Agent</span>
              </button>
              <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                <Bot className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-900">Bot Settings</span>
              </button>
              <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-900">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}