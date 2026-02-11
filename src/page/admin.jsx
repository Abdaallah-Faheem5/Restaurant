import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/admin.css';
import axios from 'axios';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_user, setUser] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', nameEn: '', description: '', displayOrder: '' });
  const [itemForm, setItemForm] = useState({ categoryId: '', name: '', nameEn: '', description: '', price: '', imageUrl: '' });

  const API_URL = import.meta.env.VITE_SERVER_URL;
  const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.message || fallback;

  // Check if user is admin
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'admin') {
      navigate('/home');
      return;
    }
    setUser(userData);
  }, [navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/menu/categories`);
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_URL}/menu/items`);
        if (response.data.success) {
          setItems(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Category handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/menu/categories`, categoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories([...categories, response.data.data]);
        setCategoryForm({ name: '', description: '' });
        setShowCategoryModal(false);
        alert('تم إضافة الفئة بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في إضافة الفئة'));
      console.error(error);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/menu/categories/${editingCategory._id}`, categoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(categories.map(c => c._id === editingCategory._id ? response.data.data : c));
        setCategoryForm({ name: '', description: '' });
        setEditingCategory(null);
        setShowCategoryModal(false);
        alert('تم تحديث الفئة بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في تحديث الفئة'));
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/menu/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(categories.filter(c => c._id !== id));
        alert('تم حذف الفئة بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في حذف الفئة'));
      console.error(error);
    }
  };

  // Item handlers
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/menu/items`, itemForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setItems([...items, response.data.data]);
        setItemForm({ name: '', description: '', price: '', categoryId: '', imageUrl: '' });
        setShowItemModal(false);
        alert('تم إضافة الطبق بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في إضافة الطبق'));
      console.error(error);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/menu/items/${editingItem._id}`, itemForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setItems(items.map(i => i._id === editingItem._id ? response.data.data : i));
        setItemForm({ name: '', description: '', price: '', categoryId: '', imageUrl: '' });
        setEditingItem(null);
        setShowItemModal(false);
        alert('تم تحديث الطبق بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في تحديث الطبق'));
      console.error(error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطبق؟')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/menu/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setItems(items.filter(i => i._id !== id));
        alert('تم حذف الطبق بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في حذف الطبق'));
      console.error(error);
    }
  };

  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ 
        name: category.name, 
        nameEn: category.nameEn || '',
        description: category.description,
        displayOrder: category.displayOrder || ''
      });
    } else {
      setCategoryForm({ name: '', nameEn: '', description: '', displayOrder: '' });
    }
    setShowCategoryModal(true);
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Display preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/menu/upload-image`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setItemForm((prev) => ({ ...prev, imageUrl: response.data.imageUrl }));
        alert('تم رفع الصورة بنجاح');
      }
    } catch (error) {
      alert(getApiErrorMessage(error, 'خطأ في رفع الصورة'));
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        categoryId: item.categoryId,
        name: item.name,
        nameEn: item.nameEn || '',
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl || item.image || ''
      });
      setImagePreview(item.imageUrl || item.image || null);
    } else {
      setItemForm({ categoryId: '', name: '', nameEn: '', description: '', price: '', imageUrl: '' });
      setImagePreview(null);
    }
    setShowItemModal(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="admin-page">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-container">
          <h1>لوحة التحكم - الإدارة</h1>
          <div className="header-actions">
            <button className="home-btn" onClick={() => navigate('/home')}>← العودة للرئيسية</button>
            <button className="logout-btn" onClick={handleLogout}>تسجيل الخروج</button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          إدارة الفئات
        </button>
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          إدارة الأطباق
        </button>
      </div>

      {/* Admin Content */}
      <div className="admin-content">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <section className="tab-content">
            <div className="section-header">
              <h2>إدارة الفئات</h2>
              <button className="add-btn" onClick={() => openCategoryModal()}>
                + إضافة فئة جديدة
              </button>
            </div>

            {categories.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم (عربي)</th>
                    <th>الاسم (English)</th>
                    <th>الوصف</th>
                    <th>الترتيب</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>{category.nameEn}</td>
                      <td>{category.description}</td>
                      <td>{category.displayOrder || '-'}</td>
                      <td>
                        <div className="actions">
                          <button className="edit-btn" onClick={() => openCategoryModal(category)}>
                            تعديل
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteCategory(category._id)}>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">لا توجد فئات حالياً</div>
            )}
          </section>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <section className="tab-content">
            <div className="section-header">
              <h2>إدارة الأطباق</h2>
              <button className="add-btn" onClick={() => openItemModal()}>
                + إضافة طبق جديد
              </button>
            </div>

            {items.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم (عربي)</th>
                    <th>الاسم (English)</th>
                    <th>الوصف</th>
                    <th>السعر</th>
                    <th>الفئة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const category = categories.find(c => c._id === item.categoryId);
                    return (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.nameEn}</td>
                        <td>{item.description}</td>
                        <td>{item.price} دينار</td>
                        <td>{category?.name || 'غير محدد'}</td>
                        <td>
                          <div className="actions">
                            <button className="edit-btn" onClick={() => openItemModal(item)}>
                              تعديل
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteItem(item._id)}>
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">لا توجد أطباق حالياً</div>
            )}
          </section>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</h3>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
              <div className="form-group">
                <label>الاسم (عربي)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="أدخل اسم الفئة بالعربية"
                />
              </div>
              <div className="form-group">
                <label>الاسم (English)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm({...categoryForm, nameEn: e.target.value})}
                  placeholder="Enter category name in English"
                />
              </div>
              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="أدخل وصف الفئة"
                />
              </div>
              <div className="form-group">
                <label>ترتيب العرض</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({...categoryForm, displayOrder: e.target.value})}
                  placeholder="أدخل ترتيب العرض (1, 2, 3...)"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingCategory ? 'تحديث' : 'إضافة'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowCategoryModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'تعديل الطبق' : 'إضافة طبق جديد'}</h3>
            <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
              <div className="form-group">
                <label>الفئة</label>
                <select
                  required
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({...itemForm, categoryId: e.target.value})}
                >
                  <option value="">اختر الفئة</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>الاسم (عربي)</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  placeholder="أدخل اسم الطبق بالعربية"
                />
              </div>
              <div className="form-group">
                <label>الاسم (English)</label>
                <input
                  type="text"
                  required
                  value={itemForm.nameEn}
                  onChange={(e) => setItemForm({...itemForm, nameEn: e.target.value})}
                  placeholder="Enter item name in English"
                />
              </div>
              <div className="form-group">
                <label>الوصف</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  placeholder="أدخل وصف الطبق"
                />
              </div>
              <div className="form-group">
                <label>السعر</label>
                <input
                  type="number"
                  required
                  value={itemForm.price}
                  onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                  placeholder="أدخل السعر"
                />
              </div>
              <div className="form-group">
                <label>الصورة</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p style={{color: '#d4af37', fontSize: '0.9em'}}>جاري رفع الصورة...</p>}
              </div>
              {imagePreview && (
                <div className="form-group image-preview">
                  <img src={imagePreview} alt="معاينة الصورة" style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px'}} />
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={uploadingImage}>
                  {editingItem ? 'تحديث' : 'إضافة'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowItemModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
            </div>
        </div>
        )}
    </div>
    );
};

export default Admin;
