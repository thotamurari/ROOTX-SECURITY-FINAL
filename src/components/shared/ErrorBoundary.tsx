import React, { Component, type ReactNode } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, errorId: null }

    static getDerivedStateFromError(): State {
        const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`
        return { hasError: true, errorId }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="min-h-screen bg-primary flex items-center justify-center p-6">
                    <div className="glass-card p-8 max-w-md text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-neon-red/10 rounded-2xl flex items-center justify-center">
                            <AlertOctagon className="w-8 h-8 text-neon-red" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-text-primary mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-text-secondary text-sm font-body">
                                An unexpected error occurred. Please try again.
                            </p>
                        </div>
                        {this.state.errorId && (
                            <p className="text-text-muted text-xs font-body">
                                Error ID: {this.state.errorId}
                            </p>
                        )}
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, errorId: null })
                                window.location.reload()
                            }}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
