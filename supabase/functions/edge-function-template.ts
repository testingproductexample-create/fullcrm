/**
 * Edge Function Template
 * 
 * This template provides a standardized approach to creating Supabase Edge Functions
 * with proper TypeScript support and type-only imports to avoid external dependency issues.
 */

// Type-only imports to bypass runtime checks
import type { 
  EdgeFunctionContext, 
  EdgeFunctionResponse,
  SupabaseClient,
  ValidationSchema 
} from '../edge-types.ts';

// Import utilities using relative path (these are safe)
import { 
  createHandler, 
  createSuccessResponse, 
  createErrorResponse,
  getSupabaseClient,
  logRequest,
  parseRequestBody,
  validateEnvVars
} from '../edge-utils.ts';

/**
 * Input validation schema
 * Define expected request structure here
 */
const validationSchema: ValidationSchema = {
  // Example validation rules
  organization_id: { 
    required: true, 
    type: 'string' 
  },
  // Add more validation rules as needed
};

/**
 * Main handler function
 * This is where your core logic goes
 */
const handler = async (req: Request): Promise<Response> => {
  // Log the request for debugging
  logRequest(req, { function: 'function-name' });

  try {
    // Validate required environment variables
    validateEnvVars('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');

    // Get Supabase configuration
    const { supabaseUrl, supabaseKey } = getSupabaseClient(req);

    // Parse request body
    const requestData = await parseRequestBody(req);

    // Validate request data against schema
    // (Add validation logic here if needed)

    // Initialize Supabase client (if needed)
    // const supabase = createClient(supabaseUrl, supabaseKey);

    // Your main logic here
    const result = await processRequest(requestData, { supabaseUrl, supabaseKey });

    // Create standardized response
    const response: EdgeFunctionResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    return createSuccessResponse(response, 200);

  } catch (error) {
    console.error('Edge function error:', error);
    
    const errorResponse = {
      code: 'FUNCTION_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    };

    return createErrorResponse(errorResponse, 500);
  }
};

/**
 * Core business logic
 * Extract your main function logic here for better testing and maintainability
 */
async function processRequest(
  data: any, 
  context: { supabaseUrl: string; supabaseKey: string }
): Promise<any> {
  // Example API call
  const response = await fetch(`${context.supabaseUrl}/rest/v1/table_name`, {
    headers: {
      'apikey': context.supabaseKey,
      'Authorization': `Bearer ${context.supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const result = await response.json();
  
  // Process the data
  return {
    processed: true,
    count: result.length || 0,
    data: result
  };
}

/**
 * Helper functions
 * Add any reusable helper functions here
 */

/**
 * Create a standardized response for a single item
 */
function createItemResponse(item: any, status: number = 200): Response {
  return createSuccessResponse({ 
    success: true, 
    item,
    timestamp: new Date().toISOString() 
  }, status);
}

/**
 * Create a standardized response for a list of items
 */
function createListResponse(items: any[], pagination?: any): Response {
  return createSuccessResponse({
    success: true,
    items,
    count: items.length,
    pagination,
    timestamp: new Date().toISOString()
  });
}

// Export the wrapped handler for Deno
Deno.serve(createHandler(handler));