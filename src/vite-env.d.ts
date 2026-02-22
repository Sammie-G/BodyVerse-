/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_FLUTTERWAVE_PUBLIC_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_EDAMAM_APP_ID: string;
  readonly VITE_EDAMAM_APP_KEY: string;
  readonly VITE_IPSTACK_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
