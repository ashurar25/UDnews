import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, Edit, Trash2, Search, Filter, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  newsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CategoryManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    icon: '📰',
    parentId: '',
    order: 0,
    isActive: true,
    isVisible: true
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'ข่าวทั่วไป',
        slug: 'general',
        description: 'ข่าวสารทั่วไปที่เกิดขึ้นในสังคม',
        color: '#3b82f6',
        icon: '📰',
        parentId: undefined,
        order: 1,
        isActive: true,
        isVisible: true,
        newsCount: 45,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-19'
      },
      {
        id: '2',
        name: 'ข่าวการเมือง',
        slug: 'politics',
        description: 'ข่าวสารทางการเมืองและการปกครอง',
        color: '#dc2626',
        icon: '🏛️',
        parentId: undefined,
        order: 2,
        isActive: true,
        isVisible: true,
        newsCount: 32,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-18'
      },
      {
        id: '3',
        name: 'ข่าวเศรษฐกิจ',
        slug: 'economy',
        description: 'ข่าวสารทางเศรษฐกิจและการเงิน',
        color: '#059669',
        icon: '💰',
        parentId: undefined,
        order: 3,
        isActive: true,
        isVisible: true,
        newsCount: 28,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-17'
      },
      {
        id: '4',
        name: 'ข่าวกีฬา',
        slug: 'sports',
        description: 'ข่าวสารทางกีฬาและการแข่งขัน',
        color: '#d97706',
        icon: '⚽',
        parentId: undefined,
        order: 4,
        isActive: true,
        isVisible: true,
        newsCount: 56,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-19'
      },
      {
        id: '5',
        name: 'ข่าวบันเทิง',
        slug: 'entertainment',
        description: 'ข่าวสารทางบันเทิงและศิลปะ',
        color: '#7c3aed',
        icon: '🎭',
        parentId: undefined,
        order: 5,
        isActive: true,
        isVisible: true,
        newsCount: 23,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-16'
      },
      {
        id: '6',
        name: 'ข่าวอาชญากรรม',
        slug: 'crime',
        description: 'ข่าวสารทางอาชญากรรมและความปลอดภัย',
        color: '#dc2626',
        icon: '🚨',
        parentId: undefined,
        order: 6,
        isActive: true,
        isVisible: true,
        newsCount: 18,
        createdAt: '2024-01-01',
        updatedAt: '2024-12-15'
      }
    ];
    setCategories(mockCategories);
    setIsLoading(false);
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCategory = async () => {
    try {
      // Mock API call
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        parentId: formData.parentId || undefined,
        order: formData.order,
        isActive: formData.isActive,
        isVisible: formData.isVisible,
        newsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCategories([...categories, newCategory]);
      setIsAddDialogOpen(false);
      setFormData({ name: '', slug: '', description: '', color: '#3b82f6', icon: '📰', parentId: '', order: 0, isActive: true, isVisible: true });
      
      toast({
        title: "เพิ่มหมวดหมู่สำเร็จ",
        description: `หมวดหมู่ ${newCategory.name} ถูกเพิ่มเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มหมวดหมู่ได้",
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    
    try {
      // Mock API call
      const updatedCategories = categories.map(category =>
        category.id === editingCategory.id ? { ...category, ...formData, updatedAt: new Date().toISOString() } : category
      );
      setCategories(updatedCategories);
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', color: '#3b82f6', icon: '📰', parentId: '', order: 0, isActive: true, isVisible: true });
      
      toast({
        title: "แก้ไขหมวดหมู่สำเร็จ",
        description: `หมวดหมู่ ${editingCategory.name} ถูกแก้ไขเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขหมวดหมู่ได้",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Mock API call
      const categoryToDelete = categories.find(c => c.id === categoryId);
      setCategories(categories.filter(c => c.id !== categoryId));
      
      toast({
        title: "ลบหมวดหมู่สำเร็จ",
        description: `หมวดหมู่ ${categoryToDelete?.name} ถูกลบเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive"
      });
    }
  };

  const handleOrderChange = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = categories.findIndex(c => c.id === categoryId);
      if (currentIndex === -1) return;

      const newCategories = [...categories];
      if (direction === 'up' && currentIndex > 0) {
        [newCategories[currentIndex], newCategories[currentIndex - 1]] = [newCategories[currentIndex - 1], newCategories[currentIndex]];
      } else if (direction === 'down' && currentIndex < newCategories.length - 1) {
        [newCategories[currentIndex], newCategories[currentIndex + 1]] = [newCategories[currentIndex + 1], newCategories[currentIndex]];
      }

      // Update order numbers
      newCategories.forEach((category, index) => {
        category.order = index + 1;
      });

      setCategories(newCategories);
      
      toast({
        title: "เปลี่ยนลำดับสำเร็จ",
        description: "ลำดับหมวดหมู่ถูกอัปเดตเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยนลำดับได้",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parentId || '',
      order: category.order,
      isActive: category.isActive,
      isVisible: category.isVisible
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-600">ใช้งาน</Badge>
    ) : (
      <Badge variant="secondary">ไม่ใช้งาน</Badge>
    );
  };

  const getVisibilityBadge = (isVisible: boolean) => {
    return isVisible ? (
      <Badge variant="default" className="bg-blue-600">แสดงผล</Badge>
    ) : (
      <Badge variant="outline">ซ่อน</Badge>
    );
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
          <h2 className="text-2xl font-bold font-kanit text-orange-800">จัดการหมวดหมู่ข่าว</h2>
          <p className="text-gray-600 font-sarabun">สร้าง แก้ไข และจัดระเบียบหมวดหมู่ข่าว</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มหมวดหมู่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
              <DialogDescription>สร้างหมวดหมู่ข่าวใหม่</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-name">ชื่อหมวดหมู่</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="กรอกชื่อหมวดหมู่"
                  />
                </div>
                <div>
                  <Label htmlFor="add-slug">Slug</Label>
                  <Input
                    id="add-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="กรอก slug"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="add-description">คำอธิบาย</Label>
                <Textarea
                  id="add-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="กรอกคำอธิบาย"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-color">สี</Label>
                  <Input
                    id="add-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-icon">ไอคอน</Label>
                  <Input
                    id="add-icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="📰"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-order">ลำดับ</Label>
                  <Input
                    id="add-order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="add-parent">หมวดหมู่หลัก</Label>
                  <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="ไม่มี" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ไม่มี</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="add-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <Label htmlFor="add-active">ใช้งาน</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="add-visible"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  />
                  <Label htmlFor="add-visible">แสดงผล</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleAddCategory}>เพิ่มหมวดหมู่</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-gray-600">หมวดหมู่ทั้งหมด</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{categories.filter(c => c.isActive).length}</p>
                <p className="text-sm text-gray-600">หมวดหมู่ที่ใช้งาน</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{categories.filter(c => c.isVisible).length}</p>
                <p className="text-sm text-gray-600">หมวดหมู่ที่แสดงผล</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{categories.reduce((acc, c) => acc + c.newsCount, 0)}</p>
                <p className="text-sm text-gray-600">ข่าวทั้งหมด</p>
              </div>
              <FolderOpen className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="ค้นหาหมวดหมู่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลำดับ</TableHead>
                <TableHead>ชื่อหมวดหมู่</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead>จำนวนข่าว</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>การแสดงผล</TableHead>
                <TableHead>วันที่อัปเดต</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOrderChange(category.id, 'up')}
                        disabled={category.order === 1}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="font-medium">{category.order}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOrderChange(category.id, 'down')}
                        disabled={category.order === categories.length}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span style={{ color: category.color }} className="text-lg">{category.icon}</span>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500">/{category.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-xs truncate">{category.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.newsCount}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(category.isActive)}</TableCell>
                  <TableCell>{getVisibilityBadge(category.isVisible)}</TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">{category.updatedAt}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบหมวดหมู่</AlertTitle>
                            <AlertDialogDescription>
                              คุณต้องการลบหมวดหมู่ {category.name} หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                              ลบหมวดหมู่
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลหมวดหมู่ {editingCategory?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">ชื่อหมวดหมู่</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อหมวดหมู่"
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="กรอก slug"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">คำอธิบาย</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="กรอกคำอธิบาย"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-color">สี</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-icon">ไอคอน</Label>
                <Input
                  id="edit-icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📰"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-order">ลำดับ</Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="edit-parent">หมวดหมู่หลัก</Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="ไม่มี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ไม่มี</SelectItem>
                    {categories.filter(c => c.id !== editingCategory?.id).map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="edit-active">ใช้งาน</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-visible"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                />
                <Label htmlFor="edit-visible">แสดงผล</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleEditCategory}>บันทึกการเปลี่ยนแปลง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 