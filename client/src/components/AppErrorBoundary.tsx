import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: any };

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Optionally send to analytics/logging endpoint
    try {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'ui.error', payload: { message: String(error), errorInfo } }),
      });
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-8 max-w-xl p-4 border rounded bg-muted/30">
          <h2 className="font-kanit text-lg mb-2">ขออภัย เกิดข้อผิดพลาดในการแสดงผล</h2>
          <p className="font-sarabun text-sm text-muted-foreground">โปรดลองรีเฟรชหน้าหรือกลับไปยังหน้าแรก</p>
        </div>
      );
    }
    return this.props.children;
  }
}
