import React, { useState, useEffect } from 'react';
import { Calendar, Building2, Users, Clock, TrendingUp } from 'lucide-react';

interface BusinessLocation {
  id: string;
  location_name: string;
  city: string;
  emirate: string;
  is_primary: boolean;
  max_concurrent_appointments: number;
}

interface DashboardStats {
  total_locations: number;
  total_staff_availability: number;
  total_skills: number;
  avg_utilization: number;
}

export default function AdvancedCalendarDashboard() {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_locations: 0,
    total_staff_availability: 0,
    total_skills: 0,
    avg_utilization: 0
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Advanced Calendar Management
          </h1>
          <p className="text-purple-200">
            Multi-location scheduling, staff availability, and resource management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Building2 className="w-8 h-8" />}
            label="Active Locations"
            value="3"
            subtitle="Dubai, Abu Dhabi, Sharjah"
            color="purple"
          />
          <StatCard
            icon={<Users className="w-8 h-8" />}
            label="Staff Availability"
            value="0"
            subtitle="Add your working hours"
            color="blue"
          />
          <StatCard
            icon={<Calendar className="w-8 h-8" />}
            label="Skills Tracked"
            value="0"
            subtitle="Configure staff skills"
            color="indigo"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            label="Avg Utilization"
            value="0%"
            subtitle="Resource efficiency"
            color="violet"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              title="Manage Locations"
              description="Add or edit business branches"
              href="/locations"
              icon={<Building2 className="w-6 h-6" />}
            />
            <ActionCard
              title="Set Availability"
              description="Configure your working hours"
              href="/availability"
              icon={<Clock className="w-6 h-6" />}
            />
            <ActionCard
              title="Skills & Training"
              description="Manage staff skills"
              href="/skills"
              icon={<Users className="w-6 h-6" />}
            />
          </div>
        </div>

        {/* Locations Overview */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">UAE Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LocationCard
              name="Dubai Main Branch"
              city="Dubai"
              emirate="Dubai"
              capacity={15}
              isPrimary={true}
            />
            <LocationCard
              name="Abu Dhabi Branch"
              city="Abu Dhabi"
              emirate="Abu Dhabi"
              capacity={12}
              isPrimary={false}
            />
            <LocationCard
              name="Sharjah Branch"
              city="Sharjah"
              emirate="Sharjah"
              capacity={10}
              isPrimary={false}
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Multi-Location Support"
            features={[
              "Manage multiple branches",
              "Location-specific schedules",
              "Prayer break configuration",
              "Emirates-wide coverage"
            ]}
          />
          <FeatureCard
            title="Staff Management"
            features={[
              "Skill-based scheduling",
              "Availability tracking",
              "Concurrent appointment limits",
              "Performance analytics"
            ]}
          />
          <FeatureCard
            title="Advanced Features"
            features={[
              "External calendar sync",
              "Conflict resolution",
              "Resource utilization",
              "Automated reminders"
            ]}
          />
          <FeatureCard
            title="UAE Compliance"
            features={[
              "Islamic calendar integration",
              "Ramadan schedule support",
              "Prayer time breaks",
              "Weekend configuration"
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, color }: any) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    indigo: 'from-indigo-500/20 to-indigo-600/20 text-indigo-400',
    violet: 'from-violet-500/20 to-violet-600/20 text-violet-400'
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-300 mb-1">{label}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  );
}

function ActionCard({ title, description, href, icon }: any) {
  return (
    <a
      href={href}
      className="bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-xl border border-white/10 p-6 transition-all hover:scale-105 hover:border-purple-500/30 group"
    >
      <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </a>
  );
}

function LocationCard({ name, city, emirate, capacity, isPrimary }: any) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-purple-400" />
        </div>
        {isPrimary && (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
            Primary
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
      <p className="text-sm text-gray-400 mb-4">{city}, {emirate}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Max Capacity:</span>
        <span className="text-purple-400 font-medium">{capacity} concurrent</span>
      </div>
    </div>
  );
}

function FeatureCard({ title, features }: any) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
            </div>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
