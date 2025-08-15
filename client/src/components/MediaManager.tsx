import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard, GlassCardHeader } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, File, Trash2, Search, Filter, Download, Eye, Copy, FolderOpen } from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: number;
  url: string;
  thumbnail?: string;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  altText?: string;
  description?: string;
}

export default function MediaManager() {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Mock data for demonstration
  useEffect(() => {
    const mockFiles: MediaFile[] = [
      {
        id: '1',
        name: 'news-hero.jpg',
        type: 'image',
        size: 245760, // 240KB
        url: '/uploads/news-hero.jpg',
        thumbnail: '/uploads/thumbnails/news-hero.jpg',
        uploadedAt: '2024-12-19 10:30:00',
        uploadedBy: 'admin',
        tags: ['ข่าว', 'ภาพหลัก'],
        altText: 'ภาพหลักข่าว',
        description: 'ภาพประกอบข่าวหลักของเว็บไซต์'
      },
      {
        id: '2',
        name: 'sports-news.mp4',
        type: 'video',
        size: 5242880, // 5MB
        url: '/uploads/sports-news.mp4',
        thumbnail: '/uploads/thumbnails/sports-news.jpg',
        uploadedAt: '2024-12-18 15:45:00',
        uploadedBy: 'editor1',
        tags: ['กีฬา', 'วิดีโอ'],
        altText: 'วิดีโอข่าวกีฬา',
        description: 'วิดีโอข่าวกีฬาล่าสุด'
      },
      {
        id: '3',
        name: 'newsletter-template.pdf',
        type: 'document',
        size: 1048576, // 1MB
        url: '/uploads/newsletter-template.pdf',
        uploadedAt: '2024-12-17 09:15:00',
        uploadedBy: 'admin',
        tags: ['จดหมายข่าว', 'เทมเพลต'],
        altText: 'เทมเพลตจดหมายข่าว',
        description: 'เทมเพลตสำหรับจดหมายข่าว'
      }
    ];
    setFiles(mockFiles);
    setIsLoading(false);
  }, []);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || file.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) return;

    try {
      setIsLoading(true);
      
      // Mock file upload
      for (const file of uploadFiles) {
        const newFile: MediaFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: getFileType(file.type),
          size: file.size,
          url: `/uploads/${file.name}`,
          thumbnail: getFileType(file.type) === 'image' ? `/uploads/thumbnails/${file.name}` : undefined,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'admin',
          tags: [],
          altText: file.name,
          description: ''
        };
        
        setFiles(prev => [...prev, newFile]);
        
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(prev => ({ ...prev, [file.name]: i }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setUploadFiles([]);
      setUploadProgress({});
      setIsUploadDialogOpen(false);
      
      toast({
        title: "อัปโหลดไฟล์สำเร็จ",
        description: `อัปโหลดไฟล์ ${uploadFiles.length} รายการเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดไฟล์ได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Mock API call
      const fileToDelete = files.find(f => f.id === fileId);
      setFiles(files.filter(f => f.id !== fileId));
      
      toast({
        title: "ลบไฟล์สำเร็จ",
        description: `ไฟล์ ${fileToDelete?.name} ถูกลบเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบไฟล์ได้",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "ไม่มีการเลือก",
        description: "กรุณาเลือกไฟล์ที่ต้องการลบ",
        variant: "destructive"
      });
      return;
    }

    try {
      // Mock API call
      setFiles(files.filter(f => !selectedFiles.includes(f.id)));
      setSelectedFiles([]);
      
      toast({
        title: "ลบไฟล์สำเร็จ",
        description: `ลบไฟล์ ${selectedFiles.length} รายการเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบไฟล์ได้",
        variant: "destructive"
      });
    }
  };

  const getFileType = (mimeType: string): 'image' | 'video' | 'document' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-8 w-8 text-blue-600" />;
      case 'video':
        return <File className="h-8 w-8 text-red-600" />;
      case 'audio':
        return <File className="h-8 w-8 text-green-600" />;
      case 'document':
        return <File className="h-8 w-8 text-orange-600" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'image':
        return <Badge variant="default" className="bg-blue-600">รูปภาพ</Badge>;
      case 'video':
        return <Badge variant="default" className="bg-red-600">วิดีโอ</Badge>;
      case 'audio':
        return <Badge variant="default" className="bg-green-600">เสียง</Badge>;
      case 'document':
        return <Badge variant="default" className="bg-orange-600">เอกสาร</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const copyFileUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "คัดลอก URL สำเร็จ",
      description: "URL ถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
    });
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
          <h2 className="text-2xl font-bold font-kanit text-orange-800">จัดการไฟล์มีเดีย</h2>
          <p className="text-gray-600 font-sarabun">อัปโหลด จัดการ และจัดระเบียบไฟล์มีเดีย</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSelectedFiles([])}>
            <FolderOpen className="h-4 w-4 mr-2" />
            เลือกทั้งหมด
          </Button>
          {selectedFiles.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบที่เลือก ({selectedFiles.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการลบไฟล์</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณต้องการลบไฟล์ที่เลือก {selectedFiles.length} รายการหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>
                    ลบไฟล์
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Upload className="h-4 w-4 mr-2" />
                อัปโหลดไฟล์
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>อัปโหลดไฟล์</DialogTitle>
                <DialogDescription>เลือกไฟล์ที่ต้องการอัปโหลด</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">เลือกไฟล์</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                </div>
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>ไฟล์ที่เลือก:</Label>
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleFileUpload} disabled={uploadFiles.length === 0}>
                  อัปโหลด
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{files.length}</p>
                <p className="text-sm text-gray-600">ไฟล์ทั้งหมด</p>
              </div>
              <File className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{files.filter(f => f.type === 'image').length}</p>
                <p className="text-sm text-gray-600">รูปภาพ</p>
              </div>
              <Image className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{files.filter(f => f.type === 'video').length}</p>
                <p className="text-sm text-gray-600">วิดีโอ</p>
              </div>
              <File className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}</p>
                <p className="text-sm text-gray-600">ขนาดรวม</p>
              </div>
              <FolderOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <GlassCard
        header={
          <GlassCardHeader
            title={
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-gray-500" />
                  <Input
                    placeholder="ค้นหาไฟล์..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="ประเภทไฟล์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="image">รูปภาพ</SelectItem>
                      <SelectItem value="video">วิดีโอ</SelectItem>
                      <SelectItem value="audio">เสียง</SelectItem>
                      <SelectItem value="document">เอกสาร</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="relative group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles([...selectedFiles, file.id]);
                      } else {
                        setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                      }
                    }}
                  />
                  {getTypeBadge(file.type)}
                </div>
                
                <div className="text-center mb-3">
                  {file.thumbnail ? (
                    <img 
                      src={file.thumbnail} 
                      alt={file.altText || file.name}
                      className="w-full h-24 object-cover rounded mx-auto"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-gray-500">
                    อัปโหลดโดย: {file.uploadedBy}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file.uploadedAt}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 mt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    ดู
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    ดาวน์โหลด
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyFileUrl(file.url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบไฟล์</AlertDialogTitle>
                        <AlertDialogDescription>
                          คุณต้องการลบไฟล์ {file.name} หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteFile(file.id)}>
                          ลบไฟล์
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}