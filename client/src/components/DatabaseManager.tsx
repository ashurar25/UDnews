import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Database, RefreshCw, Download, Upload, Trash2, Search, Filter, Eye, Edit, Plus, Settings, BarChart3, Users, FileText, MessageSquare, Bell } from "lucide-react";

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  performance: {
    queryTime: number;
    activeConnections: number;
    cacheHitRate: number;
  };
}

interface TableInfo {
  name: string;
  recordCount: number;
  size: string;
  lastModified: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimary: boolean;
  isUnique: boolean;
}

interface IndexInfo {
  name: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  isUnique: boolean;
}

interface ConstraintInfo {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  columns: string[];
  referenceTable?: string;
  referenceColumns?: string[];
}

export default function DatabaseManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { 'Authorization': token ? `Bearer ${token}` : '' } as Record<string, string>;
  };

  const handleUnauthorized = (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin';
      return true;
    }
    return false;
  };

  // Load database information
  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      
      // Fetch database stats
      const statsResponse = await fetch('/api/database/stats', { headers: { ...getAuthHeaders() } });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setDatabaseStats(stats);
      } else {
        if (handleUnauthorized(statsResponse)) return;
        let errorData: any = {};
        try { errorData = await statsResponse.json(); } catch {}
        throw new Error(errorData.error || `HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
      }

      // Fetch tables info
      const tablesResponse = await fetch('/api/database/tables', { headers: { ...getAuthHeaders() } });
      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json();
        setTables(tablesData);
      } else {
        if (handleUnauthorized(tablesResponse)) return;
        let errorData: any = {};
        try { errorData = await tablesResponse.json(); } catch {}
        throw new Error(errorData.error || `HTTP ${tablesResponse.status}: ${tablesResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error loading database info:', error);
      
      let errorMessage = "ไม่สามารถโหลดข้อมูลฐานข้อมูลได้";
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
          errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
        } else if (error.message.includes('Database connection failed')) {
          errorMessage = "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่าฐานข้อมูล";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      const response = await fetch(`/api/database/tables/${tableName}/data?limit=100`, {
        headers: { ...getAuthHeaders() }
      });
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
        setSelectedTable(tableName);
      } else {
        if (handleUnauthorized(response)) return;
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถโหลดข้อมูลตาราง ${tableName} ได้`,
        variant: "destructive"
      });
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/database/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: backupName })
      });

      if (response.ok) {
        toast({
          title: "สำรองข้อมูลสำเร็จ",
          description: `สร้างไฟล์สำรองข้อมูล ${backupName} เรียบร้อยแล้ว`,
        });
        setIsBackupDialogOpen(false);
        setBackupName('');
        loadDatabaseInfo(); // Refresh stats
      } else {
        if (handleUnauthorized(response)) return;
        throw new Error('Backup failed');
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสำรองข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const restoreBackup = async (backupFile: File) => {
    try {
      const formData = new FormData();
      formData.append('backup', backupFile);

      const response = await fetch('/api/database/restore', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData
      });

      if (response.ok) {
        toast({
          title: "กู้คืนข้อมูลสำเร็จ",
          description: "กู้คืนข้อมูลจากไฟล์สำรองเรียบร้อยแล้ว",
        });
        setIsRestoreDialogOpen(false);
        loadDatabaseInfo(); // Refresh stats
      } else {
        if (handleUnauthorized(response)) return;
        throw new Error('Restore failed');
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถกู้คืนข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/database/clear-cache', { method: 'POST', headers: { ...getAuthHeaders() } });
      if (response.ok) {
        toast({
          title: "ล้างแคชสำเร็จ",
          description: "แคชฐานข้อมูลถูกล้างเรียบร้อยแล้ว",
        });
        loadDatabaseInfo(); // Refresh stats
      } else {
        if (handleUnauthorized(response)) return;
        throw new Error('Clear cache failed');
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถล้างแคชได้",
        variant: "destructive"
      });
    }
  };

  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600">เชื่อมต่อแล้ว</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">ไม่เชื่อมต่อ</Badge>;
      case 'error':
        return <Badge variant="destructive">เกิดข้อผิดพลาด</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-kanit text-orange-800">จัดการฐานข้อมูล</h2>
          <p className="text-gray-600 font-sarabun">ดูข้อมูลและจัดการฐานข้อมูลทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDatabaseInfo}>
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                สำรองข้อมูล
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>สร้างไฟล์สำรองข้อมูล</DialogTitle>
                <DialogDescription>สร้างไฟล์สำรองข้อมูลฐานข้อมูล</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-name">ชื่อไฟล์สำรอง</Label>
                  <Input
                    id="backup-name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="backup-2024-12-19"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={createBackup}>สร้างไฟล์สำรอง</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                กู้คืนข้อมูล
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>กู้คืนข้อมูลจากไฟล์สำรอง</DialogTitle>
                <DialogDescription>เลือกไฟล์สำรองข้อมูลเพื่อกู้คืน</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="restore-file">ไฟล์สำรองข้อมูล</Label>
                  <Input
                    id="restore-file"
                    type="file"
                    accept=".sql,.backup"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        restoreBackup(file);
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>ยกเลิก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={clearCache} className="bg-orange-600 hover:bg-orange-700">
            <Settings className="h-4 w-4 mr-2" />
            ล้างแคช
          </Button>
        </div>
      </div>

      {/* Database Overview */}
      {databaseStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{databaseStats.totalTables}</p>
                  <p className="text-sm text-gray-600">ตารางทั้งหมด</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{(databaseStats.totalRecords ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">ข้อมูลทั้งหมด</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{databaseStats.databaseSize}</p>
                  <p className="text-sm text-gray-600">ขนาดฐานข้อมูล</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{getConnectionStatusBadge(databaseStats.connectionStatus)}</p>
                  <p className="text-sm text-gray-600">สถานะการเชื่อมต่อ</p>
                </div>
                <Database className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {databaseStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ข้อมูลประสิทธิภาพ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{(databaseStats.performance?.queryTime ?? 0)}ms</p>
                <p className="text-sm text-gray-600">เวลาเฉลี่ยในการค้นหา</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{databaseStats.performance?.activeConnections ?? 0}</p>
                <p className="text-sm text-gray-600">การเชื่อมต่อที่ใช้งาน</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{databaseStats.performance?.cacheHitRate ?? 0}%</p>
                <p className="text-sm text-gray-600">อัตราการเข้าถึงแคช</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="ค้นหาตาราง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">ภาพรวมตาราง</TabsTrigger>
              <TabsTrigger value="structure">โครงสร้าง</TabsTrigger>
              <TabsTrigger value="data">ข้อมูล</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อตาราง</TableHead>
                    <TableHead>จำนวนข้อมูล</TableHead>
                    <TableHead>ขนาด</TableHead>
                    <TableHead>แก้ไขล่าสุด</TableHead>
                    <TableHead>การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables
                    .filter(table => table.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{(table.recordCount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{table.size}</TableCell>
                    <TableCell>{table.lastModified}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadTableData(table.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              {selectedTable && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">โครงสร้างตาราง: {selectedTable}</h3>
                  <div className="space-y-4">
                    {/* Columns */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">คอลัมน์</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ชื่อคอลัมน์</TableHead>
                              <TableHead>ประเภท</TableHead>
                              <TableHead>Null</TableHead>
                              <TableHead>ค่าเริ่มต้น</TableHead>
                              <TableHead>Primary Key</TableHead>
                              <TableHead>Unique</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tables
                              .find(t => t.name === selectedTable)
                              ?.columns.map((column) => (
                              <TableRow key={column.name}>
                                <TableCell className="font-medium">{column.name}</TableCell>
                                <TableCell>{column.type}</TableCell>
                                <TableCell>{column.nullable ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{column.defaultValue || '-'}</TableCell>
                                <TableCell>{column.isPrimary ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{column.isUnique ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Indexes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">ดัชนี</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ชื่อดัชนี</TableHead>
                              <TableHead>คอลัมน์</TableHead>
                              <TableHead>ประเภท</TableHead>
                              <TableHead>Unique</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tables
                              .find(t => t.name === selectedTable)
                              ?.indexes.map((index) => (
                              <TableRow key={index.name}>
                                <TableCell className="font-medium">{index.name}</TableCell>
                                <TableCell>{index.columns.join(', ')}</TableCell>
                                <TableCell>{index.type}</TableCell>
                                <TableCell>{index.isUnique ? 'Yes' : 'No'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Constraints */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">ข้อจำกัด</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ชื่อข้อจำกัด</TableHead>
                              <TableHead>ประเภท</TableHead>
                              <TableHead>คอลัมน์</TableHead>
                              <TableHead>อ้างอิง</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tables
                              .find(t => t.name === selectedTable)
                              ?.constraints.map((constraint) => (
                              <TableRow key={constraint.name}>
                                <TableCell className="font-medium">{constraint.name}</TableCell>
                                <TableCell>{constraint.type}</TableCell>
                                <TableCell>{constraint.columns.join(', ')}</TableCell>
                                <TableCell>
                                  {constraint.referenceTable 
                                    ? `${constraint.referenceTable}(${constraint.referenceColumns?.join(', ')})`
                                    : '-'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              {selectedTable && tableData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">ข้อมูลตาราง: {selectedTable}</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(tableData[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, colIndex) => (
                              <TableCell key={colIndex}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 