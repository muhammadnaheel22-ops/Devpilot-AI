import { Component } from 'react';
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Application error', error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="panel max-w-lg p-8 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted mt-3">
            The app stopped safely. Refresh the page, or inspect the browser console for details.
          </p>
          <button
            className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-white"
            onClick={() => location.reload()}
          >
            Reload application
          </button>
        </div>
      </main>
    );
  }
}
