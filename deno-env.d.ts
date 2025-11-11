// Deno global environment types for Supabase Edge Functions
declare global {
  namespace Deno {
    function serve(handler: (req: Request) => Response | Promise<Response>): void;
    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

export {};