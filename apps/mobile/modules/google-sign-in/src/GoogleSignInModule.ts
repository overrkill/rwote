import { requireNativeModule } from 'expo';

export interface GoogleSignInResult {
  idToken: string;
  accessToken: string;
  email: string;
  displayName: string;
  id: string;
}

interface GoogleSignInModuleInterface {
  configure(webClientId: string): Promise<void>;
  signIn(): Promise<GoogleSignInResult>;
  signOut(): Promise<void>;
  isSignedIn(): Promise<boolean>;
}

const GoogleSignInModule = requireNativeModule<GoogleSignInModuleInterface>('GoogleSignIn');

export default GoogleSignInModule;
