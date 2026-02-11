import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/home.css';
import axios from 'axios';
const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const API_URL = import.meta.env.VITE_SERVER_URL;

  // Get user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Fetch menu items based on selected category
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        let response;
        if (selectedCategory === 'all') {
          // Fetch all items
          response = await axios.get(`${API_URL}/menu/items`);
        } else {
          // Fetch items by category
          response = await axios.get(
            `${API_URL}/menu/items?category=${encodeURIComponent(selectedCategory)}`
          );
        }
        if (response.data.success) {
          setMenuItems(response.data.data);
        }
      } catch (error) {
        setMenuItems([]);
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedCategory]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    closeMobileMenu();
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <img src="/logo-icon.png" alt="Logo" className="logo-img" />
            <span>نكهة زمان</span>
          </div>
          <button
            type="button"
            className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="#home" onClick={closeMobileMenu}>الرئيسية</a></li>
            <li><a href="#menu" onClick={closeMobileMenu}>القائمة</a></li>
            {user?.role === 'admin' && (
              <li><button onClick={() => { closeMobileMenu(); navigate('/admin'); }} className="nav-btn nav-admin">إدارة</button></li>
            )}
            <li>
              <button onClick={() => { closeMobileMenu(); navigate('/orders'); }} className="nav-btn">
                {user?.role === 'waiter' ? 'كل الطلبات' : 'طلباتي'}
              </button>
            </li>
            <li><button onClick={handleLogout} className="nav-logout">تسجيل الخروج</button></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>نكهة زمان</h1>
          <p>تجربة طعام ملكية فريدة من نوعها</p>
          <button className="hero-btn" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>
            استكشف القائمة
          </button>
        </div>
      </section>

      {/* Menu Section */}
      <section className="menu-section" id="menu">
        <div className="menu-container">
          <h2>قائمة الطعام</h2>
          <p className="section-subtitle">اختر من أشهى الأطباق الفخمة</p>
          
          {/* Categories Filter */}
          <div className="categories-filter">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              الكل
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                className={`category-btn ${selectedCategory === category._id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category._id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          {loading ? (
            <div className="loading">جاري تحميل الأطباق...</div>
          ) : menuItems.length > 0 ? (
            <div className="menu-grid">
              {menuItems.map((item) => (
                <div key={item._id} className="menu-card">
                  <div className="menu-image">
                    {(item.imageUrl || item.image) && <img src={item.imageUrl || item.image || '/تبولة-.webp'} alt={item.name} />}
                  </div>
                  <div className="menu-info">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="menu-footer">
                      <span className="price">{item.price} دينار</span>
                      <button className="add-btn" onClick={() => { closeMobileMenu(); navigate('/orders'); }}>اطلب الآن</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-items">لا توجد أطباق في هذه الفئة</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 نكهة زمان. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};



export default Home;

