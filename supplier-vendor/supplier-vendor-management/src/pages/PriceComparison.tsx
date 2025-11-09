import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, Search } from 'lucide-react';

export default function PriceComparison() {
  const [supplierIds, setSupplierIds] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!supplierIds) return;

    setLoading(true);
    try {
      const ids = supplierIds.split(',').map(id => id.trim());
      
      const { data, error } = await supabase.functions.invoke('compare-suppliers', {
        body: {
          supplierIds: ids,
          materialType,
          quantity,
          criteria: {
            priceWeight: 0.35,
            qualityWeight: 0.30,
            deliveryWeight: 0.25,
            serviceWeight: 0.10
          }
        }
      });

      if (error) throw error;
      
      setComparison(data.data);
    } catch (error) {
      console.error('Error comparing suppliers:', error);
      alert('Error comparing suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Price Comparison</h1>
        <p className="text-white/70 mt-1">Compare prices and terms across multiple suppliers</p>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Comparison Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Supplier IDs (comma-separated)</label>
            <input
              type="text"
              value={supplierIds}
              onChange={(e) => setSupplierIds(e.target.value)}
              placeholder="e.g., uuid1, uuid2, uuid3"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Material Type</label>
            <input
              type="text"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              placeholder="e.g., Cotton Fabric"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || !supplierIds}
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50"
        >
          <Search size={20} />
          {loading ? 'Comparing...' : 'Compare Suppliers'}
        </button>
      </div>

      {comparison && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Comparison Results</h2>
          <div className="grid grid-cols-1 gap-4">
            {comparison.comparison?.map((result: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{result.supplierName}</h3>
                    <p className="text-white/60 text-sm mt-1">Partnership: {result.partnership}</p>
                  </div>
                  {index === 0 && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-white/70 text-sm">Price</span>
                    <p className="text-white font-medium">{result.price.currency} {result.price.finalPrice}</p>
                    {result.price.discount > 0 && (
                      <p className="text-green-400 text-xs">{result.price.discount}% discount</p>
                    )}
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Quality Rating</span>
                    <p className="text-white font-medium">{result.performance.qualityRating.toFixed(2)}/5</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">On-Time Delivery</span>
                    <p className="text-white font-medium">{result.performance.onTimeDelivery.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Overall Score</span>
                    <p className="text-white font-medium text-lg text-purple-400">{result.weightedScore?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
