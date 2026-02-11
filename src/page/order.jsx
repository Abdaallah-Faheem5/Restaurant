import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/order.css';

const STATUS_LABELS = {
  pending: 'معلق',
  preparing: 'قيد التحضير',
  served: 'تم التقديم',
  paid: 'مدفوع'
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

const Orders = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_SERVER_URL;

  const [user, setUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [selectedTable, setSelectedTable] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isWaiter = user?.role === 'waiter';

  const availableTables = useMemo(
    () => tables.filter((table) => table.status === 'available'),
    [tables]
  );

  const cartList = useMemo(() => Object.values(cart), [cart]);

  const totalAmount = useMemo(
    () => cartList.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0),
    [cartList]
  );

  const tableById = useMemo(() => {
    const lookup = {};
    tables.forEach((table) => {
      lookup[table._id] = table;
    });
    return lookup;
  }, [tables]);

  const formatCurrency = (amount) => `${Number(amount).toFixed(2)} دينار`;

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    try {
      return new Date(dateValue).toLocaleString('ar-EG');
    } catch {
      return '-';
    }
  };

  const getTableLabel = (order) => {
    const rawTableId =
      typeof order.tableId === 'object' && order.tableId !== null
        ? order.tableId._id
        : order.tableId;
    const table = tableById[rawTableId];

    if (table) {
      return `#${table.tableNumber}`;
    }

    if (typeof rawTableId === 'string') {
      return rawTableId.slice(-6);
    }

    return '-';
  };

  const fetchData = async (token) => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [menuResult, tablesResult, ordersResult] = await Promise.allSettled([
        axios.get(`${API_URL}/menu/items`),
        axios.get(`${API_URL}/table`),
        axios.get(`${API_URL}/orders`, { headers })
      ]);

      if (menuResult.status !== 'fulfilled' || !menuResult.value?.data?.success) {
        throw new Error('فشل جلب عناصر القائمة');
      }

      if (tablesResult.status !== 'fulfilled' || !tablesResult.value?.data?.success) {
        throw new Error('فشل جلب الطاولات');
      }

      setMenuItems(menuResult.value.data.data || []);
      setTables(tablesResult.value.data.data || []);

      if (ordersResult.status === 'fulfilled' && ordersResult.value?.data?.success) {
        const sortedOrders = [...(ordersResult.value.data.data || [])].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setOrders(sortedOrders);
      } else {
        setOrders([]);
      }
    } catch (fetchError) {
      setError(fetchError.message || 'تعذر تحميل بيانات الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    setUser(userData);
    fetchData(token);
  }, [navigate]);

  const addToCart = (item) => {
    setSuccess('');
    setError('');
    setCart((prev) => {
      const existing = prev[item._id];
      if (existing) {
        return {
          ...prev,
          [item._id]: { ...existing, quantity: existing.quantity + 1 }
        };
      }

      return {
        ...prev,
        [item._id]: { item, quantity: 1 }
      };
    });
  };

  const increaseQuantity = (itemId) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity + 1 }
      };
    });
  };

  const decreaseQuantity = (itemId) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!selectedTable) {
      setError('اختر طاولة قبل إرسال الطلب');
      return;
    }

    if (cartList.length === 0) {
      setError('أضف عنصرا واحدا على الأقل');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        tableId: selectedTable,
        notes: notes.trim(),
        items: cartList.map((entry) => ({
          menuItemId: entry.item._id,
          quantity: Number(entry.quantity)
        }))
      };

      const response = await axios.post(`${API_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setSuccess(response.data.message || 'تم إرسال الطلب بنجاح');
        setCart({});
        setSelectedTable('');
        setNotes('');
        await fetchData(token);
      } else {
        setError('تعذر إنشاء الطلب');
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'فشل إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const markOrderDelivered = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setError('');
    setSuccess('');

    try {
      setUpdatingOrderId(orderId);
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status: 'served' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        setSuccess('تم تحديث الطلب وتفريغ الطاولة');
        await fetchData(token);
      } else {
        setError('تعذر تحديث حالة الطلب');
      }
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'فشل تحديث حالة الطلب');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div className="orders-header-left">
          <h1>صفحة الطلبات</h1>
          <p>
            {user?.fullName
              ? `مرحبا ${user.fullName}`
              : isWaiter
                ? 'متابعة طلبات المطعم'
                : 'أنشئ طلبك الآن'}
          </p>
        </div>
        <div className="orders-header-actions">
          <button className="orders-nav-btn" onClick={() => navigate('/')}>
            العودة للرئيسية
          </button>
          <button className="orders-logout-btn" onClick={handleLogout}>
            تسجيل الخروج
          </button>
        </div>
      </header>

      {error && <div className="orders-alert error">{error}</div>}
      {success && <div className="orders-alert success">{success}</div>}

      {loading ? (
        <div className="orders-loading">جاري تحميل البيانات...</div>
      ) : (
        <>
          {!isWaiter && (
            <>
              <div className="orders-layout">
                <section className="orders-menu-section">
                  <h2>قائمة الأطباق</h2>
                  {menuItems.length === 0 ? (
                    <div className="orders-empty">لا توجد عناصر متاحة حاليا.</div>
                  ) : (
                    <div className="orders-menu-grid">
                      {menuItems.map((item) => (
                        <article key={item._id} className="orders-menu-card">
                          <div className="orders-menu-image">
                            <img
                              src={item.imageUrl || item.image || PLACEHOLDER_IMAGE}
                              alt={item.name}
                            />
                          </div>
                          <div className="orders-menu-content">
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <div className="orders-menu-footer">
                              <span>{formatCurrency(item.price)}</span>
                              <button onClick={() => addToCart(item)}>إضافة</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <aside className="orders-cart-section">
                  <h2>ملخص الطلب</h2>
                  <form onSubmit={submitOrder}>
                    <label htmlFor="tableId">الطاولة</label>
                    <select
                      id="tableId"
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                    >
                      <option value="">اختر طاولة</option>
                      {availableTables.map((table) => (
                        <option key={table._id} value={table._id}>
                          طاولة #{table.tableNumber} - سعة {table.capacity}
                        </option>
                      ))}
                    </select>
                    {availableTables.length === 0 && (
                      <p className="orders-hint">لا توجد طاولات متاحة حاليا.</p>
                    )}

                    <div className="orders-cart-items">
                      {cartList.length === 0 ? (
                        <p className="orders-empty">السلة فارغة.</p>
                      ) : (
                        cartList.map((entry) => (
                          <div key={entry.item._id} className="orders-cart-item">
                            <div className="orders-cart-item-info">
                              <strong>{entry.item.name}</strong>
                              <span>{formatCurrency(entry.item.price)}</span>
                            </div>
                            <div className="orders-qty-controls">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(entry.item._id)}
                              >
                                -
                              </button>
                              <span>{entry.quantity}</span>
                              <button
                                type="button"
                                onClick={() => increaseQuantity(entry.item._id)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <label htmlFor="orderNotes">ملاحظات</label>
                    <textarea
                      id="orderNotes"
                      rows="3"
                      placeholder="أي طلبات إضافية؟"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />

                    <div className="orders-total">
                      <span>الإجمالي</span>
                      <strong>{formatCurrency(totalAmount)}</strong>
                    </div>

                    <button
                      type="submit"
                      className="orders-submit-btn"
                      disabled={submitting || cartList.length === 0 || !selectedTable}
                    >
                      {submitting ? 'جاري الإرسال...' : 'تأكيد الطلب'}
                    </button>
                  </form>
                </aside>
              </div>

              <section className="orders-history">
                <h2>آخر الطلبات</h2>
                {orders.length === 0 ? (
                  <div className="orders-empty">لا توجد طلبات بعد.</div>
                ) : (
                  <div className="orders-history-grid">
                    {orders.slice(0, 8).map((order) => (
                      <article key={order._id} className="orders-history-card">
                        <div className="orders-history-row">
                          <span>طلب</span>
                          <strong>#{order._id.slice(-6)}</strong>
                        </div>
                        <div className="orders-history-row">
                          <span>الطاولة</span>
                          <strong>{getTableLabel(order)}</strong>
                        </div>
                        <div className="orders-history-row">
                          <span>الحالة</span>
                          <strong>{STATUS_LABELS[order.status] || order.status}</strong>
                        </div>
                        <div className="orders-history-row">
                          <span>العناصر</span>
                          <strong>{order.items?.length || 0}</strong>
                        </div>
                        <div className="orders-history-date">{formatDate(order.createdAt)}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {isWaiter && (
            <section className="orders-history waiter-board">
              <h2>كل الطلبات</h2>
              {orders.length === 0 ? (
                <div className="orders-empty">لا توجد طلبات حاليا.</div>
              ) : (
                <div className="orders-history-grid">
                  {orders.map((order) => {
                    const canDeliver = order.status !== 'served' && order.status !== 'paid';
                    const isUpdating = updatingOrderId === order._id;

                    return (
                      <article key={order._id} className="orders-history-card">
                        <div className="orders-history-row">
                          <span>طلب</span>
                          <strong>#{order._id.slice(-6)}</strong>
                        </div>
                        <div className="orders-history-row">
                          <span>الطاولة</span>
                          <strong>{getTableLabel(order)}</strong>
                        </div>
                        <div className="orders-history-row">
                          <span>الحالة</span>
                          <strong>{STATUS_LABELS[order.status] || order.status}</strong>
                        </div>
                        <div className="orders-history-row">
                          <span>العناصر</span>
                          <strong>{order.items?.length || 0}</strong>
                        </div>
                        <div className="orders-history-date">{formatDate(order.createdAt)}</div>

                        <button
                          type="button"
                          className="orders-deliver-btn"
                          onClick={() => markOrderDelivered(order._id)}
                          disabled={!canDeliver || isUpdating}
                        >
                          {isUpdating ? 'جاري التحديث...' : canDeliver ? 'تم التوصيل' : 'مكتمل'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Orders;
