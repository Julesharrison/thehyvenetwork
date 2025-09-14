import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Test 1: Check if Supabase client is initialized
      console.log('Supabase client:', supabase);
      
      // Test 2: Try to get session (this will work even without authentication)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      // Test 3: Try a simple query (this might fail if no tables exist, but connection should work)
      const { data, error } = await supabase
        .from('users') // This table might not exist yet
        .select('count')
        .limit(1);
      
      // If we get here without throwing, connection is working
      setConnectionStatus('success');
      setSupabaseInfo({
        url: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        session: session ? 'User logged in' : 'No active session',
        queryResult: error ? `Query error (expected): ${error.message}` : 'Query successful'
      });
      
    } catch (error: any) {
      console.error('Supabase connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Unknown error occurred');
    }
  };

  return (
    <div className="p-8 bg-background min-h-screen flex flex-col gap-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light text-foreground mb-2">Supabase Connection Test</h1>
        <p className="text-muted-foreground">Testing Supabase database connection</p>
      </div>
      
      {/* Connection Status */}
      <div className={`p-6 rounded-lg shadow-lg ${
        connectionStatus === 'success' ? 'bg-green-500/20 border border-green-500/50' :
        connectionStatus === 'error' ? 'bg-red-500/20 border border-red-500/50' :
        'bg-yellow-500/20 border border-yellow-500/50'
      }`}>
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Connection Status: {
            connectionStatus === 'success' ? '✅ Connected' :
            connectionStatus === 'error' ? '❌ Failed' :
            '🔄 Testing...'
          }
        </h2>
        
        {connectionStatus === 'error' && (
          <div className="mb-4">
            <h3 className="font-medium text-red-400 mb-2">Error Details:</h3>
            <p className="text-red-300 text-sm bg-red-900/20 p-3 rounded">{errorMessage}</p>
          </div>
        )}
        
        {supabaseInfo && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supabase URL:</span>
                <span className="text-foreground font-mono text-xs">{supabaseInfo.url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Anon Key Present:</span>
                <span className="text-foreground">{supabaseInfo.hasAnonKey ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session Status:</span>
                <span className="text-foreground">{supabaseInfo.session}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database Query:</span>
                <span className="text-foreground text-xs">{supabaseInfo.queryResult}</span>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={testSupabaseConnection}
          className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/80 transition"
        >
          Test Again
        </button>
      </div>

      {/* Environment Variables Check */}
      <div className="p-6 rounded-lg bg-card text-card-foreground shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">VITE_SUPABASE_URL:</span>
            <span className="text-foreground font-mono text-xs">
              {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VITE_SUPABASE_ANON_KEY:</span>
            <span className="text-foreground font-mono text-xs">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 rounded-lg bg-muted/50 border border-border">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Setup Instructions</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>1. Go to your <a href="https://app.supabase.com" target="_blank" className="text-primary hover:underline">Supabase Dashboard</a></p>
          <p>2. Select your project</p>
          <p>3. Go to Settings → API</p>
          <p>4. Copy the "Project URL" and "anon/public" key</p>
          <p>5. Update your .env file with these values</p>
          <p>6. Restart your development server</p>
        </div>
      </div>
    </div>
  )
}
