import Login from './Login';

/**
 * Standalone /signup route — renders the shared auth page forced into signup mode.
 * URL stays as /signup; toggling "Sign in" navigates to /login.
 */
const SignupPage = () => <Login defaultMode="signup" />;

export default SignupPage;
