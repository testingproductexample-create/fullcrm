'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon, UserIcon, PaperAirplaneIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useChatSessions } from '@/hooks/useCommunication';

export default function ChatSupportPage() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';

  const { data: sessions, isLoading } = useChatSessions(organizationId);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Calculate stats from real data
  const activeSessions = sessions?.filter(s => s.status === 'active') || [];
  const waitingSessions = sessions?.filter(s => s.status === 'waiting') || [];
  const avgResponseTime = '1.2m'; // Would be calculated from actual response times
  const todayTotal = sessions?.length || 0;
  const resolvedToday = sessions?.filter(s => s.status === 'resolved').length || 0;

  // Mock chat messages for selected session
  const chatMessages = selectedSession ? [
    { sender: 'customer', text: 'Hello, I need help with my order', time: '14:25' },
    { sender: 'agent', text: 'Hello! I would be happy to help. Can you provide your order number?', time: '14:26' },
    { sender: 'customer', text: selectedSession.subject || 'I have a question', time: '14:27' },
    { sender: 'agent', text: 'Thank you! Let me check that for you.', time: '14:28' },
  ] : [];

  const calculateDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Chat Support</h1>
              <p className="text-gray-600">Real-time customer support conversations</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Chats</h3>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? '...' : activeSessions.length}
            </p>
            <p className="text-xs text-green-600 mt-1">{waitingSessions.length} waiting</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Response Time</h3>
            <p className="text-3xl font-bold text-gray-900">{avgResponseTime}</p>
            <p className="text-xs text-gray-500 mt-1">72 seconds</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Satisfaction</h3>
            <p className="text-3xl font-bold text-gray-900">4.8</p>
            <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Today's Chats</h3>
            <p className="text-3xl font-bold text-gray-900">{todayTotal}</p>
            <p className="text-xs text-gray-500 mt-1">{resolvedToday} resolved</p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session List */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Active Sessions</h2>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : sessions && sessions.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {sessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => setSelectedSession(session)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedSession?.id === session.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {(session.customers?.name || 'U').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {session.customers?.name || 'Anonymous'}
                          </h3>
                          <span className={`w-2 h-2 rounded-full ${
                            session.status === 'active' ? 'bg-green-500' :
                            session.status === 'waiting' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}></span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {session.subject || 'Chat session'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3" />
                          <span>{calculateDuration(session.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No active chat sessions</div>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 flex flex-col h-[600px]">
              {selectedSession ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {(selectedSession.customers?.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedSession.customers?.name || 'Anonymous User'}
                        </h3>
                        <p className="text-xs text-green-600">
                          {selectedSession.status} - {calculateDuration(selectedSession.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200">
                        On Hold
                      </button>
                      <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
                        Resolve
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'agent' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'agent' ? 'text-indigo-200' : 'text-gray-500'
                          }`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <PaperAirplaneIcon className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p>Select a chat session to view conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
