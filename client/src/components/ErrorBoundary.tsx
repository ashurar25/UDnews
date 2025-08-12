import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">เกิดข้อผิดพลาด</CardTitle>
            <CardDescription>
              เกิดข้อผิดพลาดที่ไม่คาดคิดในระบบ กรุณาลองใหม่อีกครั้ง
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg text-left">
              <p className="font-medium mb-2">รายละเอียดข้อผิดพลาด:</p>
              <p className="font-mono text-xs break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                ลองใหม่
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                กลับหน้าหลัก
              </Button>
            </div>
            
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                ดูรายละเอียดเพิ่มเติม
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 