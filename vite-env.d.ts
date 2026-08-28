/// <reference types="vite/client" />

// Augment Vite's default ImportMetaEnv with our custom env variables
interface ImportMetaEnv {
  readonly VITE_ADMIN_PIN: string;
  readonly VITE_ADMIN_SALT: string;
  readonly VITE_SELLER1_SALT: string;
  readonly VITE_SELLER2_SALT: string;
}
