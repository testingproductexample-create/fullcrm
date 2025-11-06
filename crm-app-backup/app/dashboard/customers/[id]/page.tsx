'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Customer, 
  CustomerMeasurement, 
  CustomerCommunication, 
  CustomerNote,
  CustomerEvent 
} from '@/types/database';
import { 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  MessageSquare,
  Ruler,
  StickyNote,
  Edit,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);
  const [communications, setCommunications] = useState<CustomerCommunication[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'communications' | 'notes' | 'events'>('overview');

  useEffect(() => {
    fetchCustomerData();
  }, [customerId, profile]);

  async function fetchCustomerData() {
    if (!profile?.organization_id) return;

    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customerData) {
        router.push('/dashboard/customers');
        return;
      }
      setCustomer(customerData);

      // Fetch measurements
      const { data: measurementsData } = await supabase
        .from('customer_measurements')
        .select('*')
        .eq('customer_id', customerId)
        .order('measurement_date', { ascending: false })
        .limit(10);
      setMeasurements(measurementsData || []);

      // Fetch communications
      const { data: commsData } = await supabase
        .from('customer_communications')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);
      setCommunications(commsData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      setNotes(notesData || []);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('customer_events')
        .select('*')
        .eq('customer_id', customerId)
        .order('event_date', { ascending: true });
      setEvents(eventsData || []);

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="h-96 bg-glass-light rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-semantic-success/20 text-green-900';
      case 'Inactive':
        return 'bg-neutral-200 text-neutral-700';
      case 'Blocked':
        return 'bg-semantic-error/20 text-red-900';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-100 text-purple-900';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-900';
      case 'Silver':
        return 'bg-gray-200 text-gray-900';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/customers"
          className="p-2 hover:bg-glass-light rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-h2 font-bold text-neutral-900">{customer.full_name}</h1>
          <p className="text-body text-neutral-700">Customer ID: {customer.customer_code}</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Edit Customer
        </button>
      </div>

      {/* Customer Profile Card */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-small text-neutral-700 mb-1">Contact Information</p>
            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-700" />
                  <span className="text-body">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-700" />
                  <span className="text-body">{customer.phone}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-700" />
                  <span className="text-body">{customer.city}, {customer.emirate}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Status</p>
            <div className="space-y-2">
              <span className={`px-3 py-1 rounded-full text-tiny font-medium inline-block ${getStatusColor(customer.status)}`}>
                {customer.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-tiny font-medium inline-block ml-2 ${getTierColor(customer.loyalty_tier)}`}>
                {customer.loyalty_tier}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <Award className="w-4 h-4 text-semantic-warning" />
                <span className="text-body">{customer.loyalty_points} Points</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Order History</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span className="text-body">{customer.total_orders} Orders</span>
              </div>
              <div>
                <p className="text-large font-bold text-primary-600">
                  AED {parseFloat(customer.total_spent.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-tiny text-neutral-700">Total Spent</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-small text-neutral-700 mb-1">Customer Since</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-700" />
                <span className="text-body">
                  {format(new Date(customer.customer_since), 'MMM dd, yyyy')}
                </span>
              </div>
              {customer.date_of_birth && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-700" />
                  <span className="text-body">
                    Birthday: {format(new Date(customer.date_of_birth), 'MMM dd')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-glass-border">
          <div className="flex overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: TrendingUp },
              { key: 'measurements', label: 'Measurements', icon: Ruler },
              { key: 'communications', label: 'Communications', icon: MessageSquare },
              { key: 'notes', label: 'Notes', icon: StickyNote },
              { key: 'events', label: 'Events', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Customer Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">Personal Information</h4>
                    <dl className="space-y-2">
                      {customer.gender && (
                        <div>
                          <dt className="text-small text-neutral-700">Gender</dt>
                          <dd className="text-body">{customer.gender}</dd>
                        </div>
                      )}
                      {customer.nationality && (
                        <div>
                          <dt className="text-small text-neutral-700">Nationality</dt>
                          <dd className="text-body">{customer.nationality}</dd>
                        </div>
                      )}
                      {customer.emirates_id && (
                        <div>
                          <dt className="text-small text-neutral-700">Emirates ID</dt>
                          <dd className="text-body">{customer.emirates_id}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="glass-card p-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">Address</h4>
                    <p className="text-body">
                      {customer.address_line1}<br />
                      {customer.address_line2 && <>{customer.address_line2}<br /></>}
                      {customer.city}, {customer.emirate}<br />
                      {customer.postal_code}
                    </p>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Notes</h4>
                  <p className="text-body text-neutral-700">{customer.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'measurements' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Measurement History</h3>
              {measurements.length === 0 ? (
                <p className="text-body text-neutral-700">No measurements recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {measurements.map((measurement) => (
                    <div key={measurement.id} className="glass-card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{measurement.garment_type}</p>
                          <p className="text-small text-neutral-700">
                            {format(new Date(measurement.measurement_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {measurement.is_latest && (
                          <span className="px-3 py-1 rounded-full text-tiny font-medium bg-primary-50 text-primary-600">
                            Latest
                          </span>
                        )}
                      </div>
                      {measurement.fitting_notes && (
                        <p className="text-small text-neutral-700 mt-2">{measurement.fitting_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Communication History</h3>
              {communications.length === 0 ? (
                <p className="text-body text-neutral-700">No communications recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="glass-card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{comm.subject || comm.communication_type}</p>
                          <p className="text-small text-neutral-700">
                            {format(new Date(comm.created_at), 'MMM dd, yyyy HH:mm')} • {comm.direction}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                          comm.status === 'Sent' ? 'bg-blue-50 text-blue-900' :
                          comm.status === 'Delivered' ? 'bg-green-50 text-green-900' :
                          comm.status === 'Failed' ? 'bg-red-50 text-red-900' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {comm.status}
                        </span>
                      </div>
                      {comm.message && (
                        <p className="text-small text-neutral-700 mt-2">{comm.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Customer Notes</h3>
              {notes.length === 0 ? (
                <p className="text-body text-neutral-700">No notes recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="glass-card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-3 py-1 rounded-full text-tiny font-medium ${
                          note.note_type === 'Important' ? 'bg-red-50 text-red-900' :
                          note.note_type === 'Complaint' ? 'bg-yellow-50 text-yellow-900' :
                          note.note_type === 'Feedback' ? 'bg-blue-50 text-blue-900' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {note.note_type}
                        </span>
                        <p className="text-small text-neutral-700">
                          {format(new Date(note.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <p className="text-body text-neutral-900 mt-2">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">Special Events</h3>
              {events.length === 0 ? (
                <p className="text-body text-neutral-700">No events recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="glass-card p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-neutral-900">{event.event_type}</p>
                          <p className="text-small text-neutral-700">
                            {format(new Date(event.event_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-tiny text-neutral-700 mt-1">
                            Recurrence: {event.recurrence}
                          </p>
                        </div>
                        {event.is_active && (
                          <span className="px-3 py-1 rounded-full text-tiny font-medium bg-semantic-success/20 text-green-900">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
