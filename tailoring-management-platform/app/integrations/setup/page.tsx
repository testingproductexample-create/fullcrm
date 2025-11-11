'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCardIcon,
  TruckIcon,
  ShareIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { IntegrationProvider } from '@/types/integrations';

export default function IntegrationSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'development'>('production');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // Fetch available providers
  const { data: providers } = useQuery({
    queryKey: ['integration-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_providers')
        .select('*')
        .eq('is_active', true)
        .order('provider_name');

      if (error) throw error;
      return data as IntegrationProvider[];
    },
  });

  // Create connection mutation
  const createConnection = useMutation({
    mutationFn: async () => {
      if (!selectedProvider) throw new Error('No provider selected');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create connection
      const { data: connection, error: connError } = await supabase
        .from('integration_connections')
        .insert({
          provider_id: selectedProvider.id,
          connection_name: connectionName,
          environment,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (connError) throw connError;

      // Add credentials
      const credentialInserts = Object.entries(credentials).map(([key, value]) => ({
        connection_id: connection.id,
        credential_type: key.includes('secret') ? 'client_secret' : 'api_key',
        credential_key: key,
        encrypted_value: value, // In production, encrypt this
        is_active: true,
      }));

      const { error: credError } = await supabase
        .from('api_credentials')
        .insert(credentialInserts);

      if (credError) throw credError;

      return connection;
    },
    onSuccess: (connection) => {
      router.push("/integrations/${connection.id}" as any as any);
    },
  });

  const providersByType = providers?.reduce((acc, provider) => {
    if (!acc[provider.provider_type]) {
      acc[provider.provider_type] = [];
    }
    acc[provider.provider_type].push(provider);
    return acc;
  }, {} as Record<string, IntegrationProvider[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCardIcon className="w-6 h-6" />;
      case 'shipping':
        return <TruckIcon className="w-6 h-6" />;
      case 'social_media':
        return <ShareIcon className="w-6 h-6" />;
      case 'marketing':
      case 'communication':
        return <EnvelopeIcon className="w-6 h-6" />;
      default:
        return <CheckCircleIcon className="w-6 h-6" />;
    }
  };

  const renderStep1 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Integration Type</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(providersByType || {}).map(([type, typeProviders]) => (
          <div key={type} className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              {getTypeIcon(type)}
              <h3 className="font-semibold text-gray-900 capitalize">
                {type.replace('_', ' ')}
              </h3>
            </div>
            
            <div className="space-y-2">
              {typeProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider);
                    setStep(2);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{provider.provider_name}</p>
                  <p className="text-sm text-gray-600">{provider.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Connection</h2>

      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Name
          </label>
          <input
            type="text"
            value={connectionName}
            onChange={(e) => setConnectionName(e.target.value)}
            placeholder={`${selectedProvider?.provider_name} - Production`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={() => setStep(3)}
            disabled={!connectionName}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const requiredFields = selectedProvider?.provider_name === 'Stripe'
      ? ['api_key', 'publishable_key', 'webhook_secret']
      : selectedProvider?.provider_name === 'PayPal'
      ? ['client_id', 'client_secret']
      : selectedProvider?.provider_name === 'Aramex'
      ? ['username', 'password', 'account_number', 'account_pin']
      : ['api_key'];

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Credentials</h2>

        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Your credentials will be encrypted and stored securely. Never share your API keys publicly.
            </p>
          </div>

          {requiredFields.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {field.replace('_', ' ')}
              </label>
              <input
                type={field.includes('secret') || field.includes('password') ? 'password' : 'text'}
                value={credentials[field] || ''}
                onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                placeholder={`Enter your ${field.replace('_', ' ')}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}

          <div className="pt-4">
            <button
              onClick={() => setStep(4)}
              disabled={requiredFields.some(field => !credentials[field])}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Complete</h2>

      <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Provider</p>
            <p className="font-semibold text-gray-900">{selectedProvider?.provider_name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Connection Name</p>
            <p className="font-semibold text-gray-900">{connectionName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Environment</p>
            <p className="font-semibold text-gray-900 capitalize">{environment}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Credentials</p>
            <p className="font-semibold text-gray-900">{Object.keys(credentials).length} credentials configured</p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => createConnection.mutate()}
            disabled={createConnection.isPending}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
          >
            {createConnection.isPending ? 'Creating...' : 'Complete Setup'}
          </button>

          {createConnection.isError && (
            <p className="text-sm text-red-600">
              Error: {(createConnection.error as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <CheckCircleIcon className="w-6 h-6" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Select Provider</span>
            <span>Configure</span>
            <span>Credentials</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        {step > 1 && step < 4 && (
          <div className="flex gap-4">
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-300 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
