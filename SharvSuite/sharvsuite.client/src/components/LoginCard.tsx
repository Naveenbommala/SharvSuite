import { Alert, Button, Card, Form } from 'react-bootstrap';

type LoginCardProps = {
  isLoading: boolean;
  error: string | null;
  onGoogleLogin: () => Promise<void>;
};

function LoginCard({ isLoading, error, onGoogleLogin }: LoginCardProps) {
  return (
    <Card className="login-card border-0 shadow-lg">
      <Card.Body className="p-4 p-sm-5">
        <div className="d-flex align-items-center justify-content-center gap-2">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark__teal" />
            <span className="brand-mark__indigo" />
          </div>
          <span className="brand-text">Sharvflow</span>
        </div>

        <h1 className="mt-4 text-center login-title">Welcome Back</h1>
        <p className="mx-auto mt-2 mb-0 text-center login-subtitle">
          Manage your business transactions securely and efficiently.
        </p>

        {error ? (
          <Alert variant="danger" className="mt-4 mb-0 py-2 small">
            {error}
          </Alert>
        ) : null}

        <Button
          type="button"
          variant="outline-secondary"
          className="mt-4 w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          disabled={isLoading}
          onClick={() => {
            void onGoogleLogin();
          }}
        >
          <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.35 11.1H12v2.98h5.4a4.62 4.62 0 0 1-2.01 3.03v2.5h3.24c1.9-1.75 2.99-4.33 2.99-7.41 0-.68-.06-1.34-.17-1.98Z"
            />
            <path
              fill="#34A853"
              d="M12 21c2.7 0 4.96-.89 6.61-2.39l-3.24-2.5c-.9.61-2.06.98-3.37.98-2.59 0-4.79-1.75-5.57-4.11H3.08v2.58A10 10 0 0 0 12 21Z"
            />
            <path
              fill="#FBBC05"
              d="M6.43 12.98A5.99 5.99 0 0 1 6.12 11c0-.69.12-1.35.31-1.98V6.44H3.08A10 10 0 0 0 2 11c0 1.61.39 3.12 1.08 4.56l3.35-2.58Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.91c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.95 1.92 14.7 1 12 1A10 10 0 0 0 3.08 6.44l3.35 2.58C7.21 6.66 9.41 4.91 12 4.91Z"
            />
          </svg>
          <span>{isLoading ? 'Signing in...' : 'Sign in with Google SSO'}</span>
        </Button>

        <div className="d-flex align-items-center gap-3 my-4">
          <div className="flex-grow-1 divider-line" />
          <span className="small fw-semibold text-secondary">OR</span>
          <div className="flex-grow-1 divider-line" />
        </div>

        <Form>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="e.g. user@company.com" />
          </Form.Group>

          <Form.Group className="mb-2" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="**********" />
          </Form.Group>
        </Form>

        <div className="text-end mb-3">
          <a className="small fw-semibold link-primary text-decoration-none" href="#">
            Forgot Password?
          </a>
        </div>

        <Button
          type="button"
          className="w-100 py-2 fw-medium"
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          disabled={isLoading}
          onClick={() => {
            void onGoogleLogin();
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="mb-0 mt-3 text-center login-terms">
          By logging in, I agree to the{' '}
          <a href="#" className="link-primary text-decoration-none">
            Terms of service
          </a>{' '}
          and{' '}
          <a href="#" className="link-primary text-decoration-none">
            Privacy policy
          </a>
          .
        </p>
      </Card.Body>
    </Card>
  );
}

export default LoginCard;
