import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-slate-800 p-8 rounded-xl border border-red-500/50 max-w-2xl w-full shadow-2xl">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Algo salió mal</h1>
                        <p className="text-slate-300 mb-4">Se ha producido un error inesperado en la aplicación.</p>

                        <div className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-60 mb-6 border border-slate-700">
                            <p className="text-red-400 font-mono text-sm mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre className="text-slate-500 text-xs font-mono whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
