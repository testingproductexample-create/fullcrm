import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MessageSquare, ThumbsUp, ThumbsDown, Star, TrendingUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  feedback_type: string;
  source: string;
  rating: number | null;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, [filterType, filterSource, filterPriority]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('quality_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('feedback_type', filterType);
      }

      if (filterSource !== 'all') {
        query = query.eq('source', filterSource);
      }

      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error: any) {
      toast.error('Failed to load feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <ThumbsUp className="w-5 h-5 text-green-400" />;
      case 'negative':
        return <ThumbsDown className="w-5 h-5 text-red-400" />;
      case 'suggestion':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-400" />;
    }
  };

  const avgRating = feedbacks.filter(f => f.rating !== null).length > 0
    ? feedbacks.filter(f => f.rating !== null).reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating !== null).length
    : 0;

  const positiveFeedback = feedbacks.filter(f => f.feedback_type === 'positive').length;
  const negativeFeedback = feedbacks.filter(f => f.feedback_type === 'negative').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Quality Feedback</h1>
        <p className="text-white/60 mt-2">
          Customer and employee feedback collection and analysis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Feedback</p>
                <p className="text-2xl font-bold text-white">{feedbacks.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-yellow-400">{avgRating.toFixed(1)}</p>
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Positive</p>
                <p className="text-2xl font-bold text-green-400">{positiveFeedback}</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Negative</p>
                <p className="text-2xl font-bold text-red-400">{negativeFeedback}</p>
              </div>
              <ThumbsDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Types</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="suggestion">Suggestion</option>
            </select>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Sources</option>
              <option value="customer">Customer</option>
              <option value="employee">Employee</option>
              <option value="supplier">Supplier</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Feedback Submissions</CardTitle>
          <CardDescription className="text-white/60">
            Recent quality feedback from customers and employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-white/60">Loading feedback...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-white/60">No feedback found</div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      {getTypeIcon(feedback.feedback_type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-3 py-1 rounded text-xs font-medium border ${getPriorityColor(feedback.priority)}`}>
                            {feedback.priority.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(feedback.status)}`}>
                            {feedback.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-white/60 text-sm flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {feedback.source}
                          </span>
                        </div>

                        {feedback.rating && (
                          <div className="flex items-center gap-1 ml-4">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < feedback.rating!
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-white/80 text-sm mb-2">
                        <span className="text-white/60">Category:</span> {feedback.category}
                      </p>
                      <p className="text-white mb-3">{feedback.description}</p>
                      
                      <p className="text-white/50 text-xs">
                        {new Date(feedback.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
