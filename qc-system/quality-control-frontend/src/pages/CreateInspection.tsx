import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Plus, Trash2, Upload, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  item_name: string;
  description: string;
  importance: string;
}

interface Checklist {
  id: string;
  checklist_name: string;
  garment_type: string;
  quality_checklist_items: ChecklistItem[];
}

const CreateInspection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<string>('');
  const [formData, setFormData] = useState({
    inspection_number: `INS-${Date.now()}`,
    garment_type: '',
    order_id: '',
    inspection_stage: 'incoming',
    inspector_id: '',
    notes: ''
  });
  const [checklistItems, setChecklistItems] = useState<any[]>([]);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const { data, error } = await supabase
        .from('quality_checklists')
        .select(`
          *,
          quality_checklist_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChecklists(data || []);
    } catch (error: any) {
      toast.error('Failed to load checklists: ' + error.message);
    }
  };

  const handleChecklistChange = (checklistId: string) => {
    setSelectedChecklist(checklistId);
    const checklist = checklists.find(c => c.id === checklistId);
    if (checklist) {
      setFormData(prev => ({ ...prev, garment_type: checklist.garment_type }));
      setChecklistItems(
        checklist.quality_checklist_items.map((item: ChecklistItem) => ({
          checklist_item_id: item.id,
          item_name: item.item_name,
          passed: true,
          notes: ''
        }))
      );
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...checklistItems];
    updatedItems[index][field] = value;
    setChecklistItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate score
      const passedItems = checklistItems.filter(item => item.passed).length;
      const totalScore = (passedItems / checklistItems.length) * 100;
      const passed = totalScore >= 80; // Pass threshold

      // Create inspection
      const { data: inspection, error: inspectionError } = await supabase
        .from('quality_inspections')
        .insert({
          ...formData,
          checklist_id: selectedChecklist,
          total_score: totalScore,
          passed,
          status: 'completed'
        })
        .select()
        .single();

      if (inspectionError) throw inspectionError;

      // Create inspection items
      const itemsToInsert = checklistItems.map(item => ({
        inspection_id: inspection.id,
        checklist_item_id: item.checklist_item_id,
        passed: item.passed,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('quality_inspection_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Inspection created successfully!');
      navigate('/inspections');
    } catch (error: any) {
      toast.error('Failed to create inspection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/inspections')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Quality Inspection</h1>
            <p className="text-white/60 mt-1">New quality inspection record</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Inspection Details</CardTitle>
            <CardDescription className="text-white/60">Basic inspection information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Inspection Number
                </label>
                <input
                  type="text"
                  value={formData.inspection_number}
                  onChange={(e) => setFormData({ ...formData, inspection_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Quality Checklist
                </label>
                <select
                  value={selectedChecklist}
                  onChange={(e) => handleChecklistChange(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  required
                >
                  <option value="">Select checklist...</option>
                  {checklists.map((checklist) => (
                    <option key={checklist.id} value={checklist.id}>
                      {checklist.checklist_name} ({checklist.garment_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="ORD-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Inspection Stage
                </label>
                <select
                  value={formData.inspection_stage}
                  onChange={(e) => setFormData({ ...formData, inspection_stage: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  required
                >
                  <option value="incoming">Incoming</option>
                  <option value="in-process">In-Process</option>
                  <option value="final">Final</option>
                  <option value="pre-shipment">Pre-Shipment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Inspector ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.inspector_id}
                  onChange={(e) => setFormData({ ...formData, inspector_id: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="EMP-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        {checklistItems.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Inspection Checklist</CardTitle>
              <CardDescription className="text-white/60">
                Mark items as passed or failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={item.passed}
                      onChange={(e) => handleItemChange(index, 'passed', e.target.checked)}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.item_name}</p>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                        className="mt-2 w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white/80 text-sm placeholder-white/40 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/inspections')}
            className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedChecklist}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create Inspection'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInspection;
