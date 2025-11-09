import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { GraduationCap, BookOpen, Award, Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface TrainingProgram {
  id: string;
  program_name: string;
  description: string;
  duration_hours: number;
  certification_required: boolean;
  status: string;
}

interface TrainingRecord {
  id: string;
  employee_id: string;
  program_id: string;
  status: string;
  score: number | null;
  completed_at: string | null;
  quality_training: TrainingProgram;
}

const Training = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'programs' | 'records'>('programs');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch training programs
      const { data: programsData, error: programsError } = await supabase
        .from('quality_training')
        .select('*')
        .order('created_at', { ascending: false });

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Fetch training records
      const { data: recordsData, error: recordsError } = await supabase
        .from('quality_training_records')
        .select(`
          *,
          quality_training(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);
    } catch (error: any) {
      toast.error('Failed to load training data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'scheduled':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const completedRecords = records.filter(r => r.status === 'completed');
  const inProgressRecords = records.filter(r => r.status === 'in_progress');
  const avgScore = completedRecords.length > 0
    ? completedRecords.reduce((sum, r) => sum + (r.score || 0), 0) / completedRecords.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Quality Training & Certification</h1>
        <p className="text-white/60 mt-2">Employee training programs and competency tracking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Active Programs</p>
                <p className="text-2xl font-bold text-white">
                  {programs.filter(p => p.status === 'active').length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Completed</p>
                <p className="text-2xl font-bold text-green-400">{completedRecords.length}</p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">{inProgressRecords.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg Score</p>
                <p className="text-2xl font-bold text-yellow-400">{avgScore.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/20">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'programs'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Training Programs
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'records'
              ? 'text-white border-b-2 border-purple-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Training Records
        </button>
      </div>

      {/* Training Programs */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-white/60">Loading programs...</div>
          ) : programs.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-white/60">No training programs found</div>
          ) : (
            programs.map((program) => (
              <Card key={program.id} className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{program.program_name}</CardTitle>
                      <CardDescription className="text-white/60 mt-2">
                        {program.description}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(program.status)}`}>
                      {program.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="w-4 h-4" />
                      <span>{program.duration_hours} hours</span>
                    </div>
                    {program.certification_required && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Award className="w-4 h-4" />
                        <span className="text-sm">Certification Required</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Training Records */}
      {activeTab === 'records' && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Training Records</CardTitle>
            <CardDescription className="text-white/60">
              Employee training progress and completion records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-white/60">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-white/60">No training records found</div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <GraduationCap className="w-6 h-6 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {record.quality_training.program_name}
                        </p>
                        <p className="text-white/60 text-sm mt-1">
                          Employee: {record.employee_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.score !== null && (
                        <div className="text-right">
                          <p className="text-white font-medium">{record.score}%</p>
                          <p className="text-white/60 text-xs">Score</p>
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Training;
